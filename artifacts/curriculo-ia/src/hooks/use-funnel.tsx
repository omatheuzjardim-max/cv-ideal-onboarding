import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useGetSession, getGetSessionQueryKey, useUpdateSession, Session } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface FunnelContextType {
  sessionId: string | null;
  session: Session | undefined;
  isLoading: boolean;
  updateData: (data: Partial<Session>) => Promise<void>;
  nextStep: (currentStep: number) => void;
  resetSession: () => void;
}

const FunnelContext = createContext<FunnelContextType | undefined>(undefined);

export function FunnelProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem("resumeSessionId"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const {
    data: session,
    isLoading: isSessionLoading,
    isError: isSessionError,
    error: sessionError,
  } = useGetSession(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getGetSessionQueryKey(sessionId || ""),
      retry: false,
    }
  });

  useEffect(() => {
    const status = (sessionError as { status?: number } | null | undefined)?.status;
    if (!sessionId || !isSessionError || status !== 404) return;

    localStorage.removeItem("resumeSessionId");
    queryClient.removeQueries({ queryKey: getGetSessionQueryKey(sessionId) });
    setSessionId(null);
  }, [isSessionError, queryClient, sessionError, sessionId]);

  useEffect(() => {
    // Check URL params for payment success
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get("session");
    const paymentParam = params.get("payment");
    
    if (sessionParam && paymentParam === "success") {
      setSessionId(sessionParam);
      localStorage.setItem("resumeSessionId", sessionParam);
      setLocation("/final");
      return;
    }

    if (!sessionId && !createSession.isPending) {
      createSession.mutate({ data: {} }, {
        onSuccess: (newSession) => {
          setSessionId(newSession.id);
          localStorage.setItem("resumeSessionId", newSession.id);
        }
      });
    }
  }, [sessionId, setLocation, createSession]);

  const updateData = async (data: Partial<Session>) => {
    if (!sessionId) return;
    
    // Optimistic update
    queryClient.setQueryData(getGetSessionQueryKey(sessionId), (old: any) => 
      old ? { ...old, ...data } : old
    );

    await updateSession.mutateAsync({
      sessionId,
      data
    });
  };

  const nextStep = (currentStep: number) => {
    setLocation(`/step/${currentStep + 1}`);
  };

  const resetSession = () => {
    localStorage.removeItem("resumeSessionId");
    setSessionId(null);
    setLocation("/");
  };

  const isLoading = !sessionId || isSessionLoading || createSession.isPending;

  return (
    <FunnelContext.Provider value={{ sessionId, session, isLoading, updateData, nextStep, resetSession }}>
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  const context = useContext(FunnelContext);
  if (context === undefined) {
    throw new Error("useFunnel must be used within a FunnelProvider");
  }
  return context;
}
