import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout } from "@/components/funnel-layout";
import { SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { useGetGenerationStatus, getGetGenerationStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const steps = [
  "Analisando seu perfil...",
  "Lendo a vaga...",
  "Calculando aderência ATS...",
  "Montando seu currículo...",
  "Finalizando...",
];

export default function Generation() {
  const [, setLocation] = useLocation();
  const { sessionId } = useFunnel();
  const queryClient = useQueryClient();
  const [stepIdx, setStepIdx] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  const { data: status } = useGetGenerationStatus(sessionId || "", {
    query: {
      enabled: !!sessionId,
      queryKey: getGetGenerationStatusQueryKey(sessionId || ""),
      refetchInterval: 2000,
    },
  });

  useEffect(() => {
    if (status?.generationStatus === "done") {
      queryClient.invalidateQueries({ queryKey: getGetGenerationStatusQueryKey(sessionId || "") });
      setLocation("/preview");
    }
  }, [status?.generationStatus, setLocation, sessionId, queryClient]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((d) => (d + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const isError = status?.generationStatus === "error";

  return (
    <FunnelLayout showProgress={false}>
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Gerando sua primeira versão</h1>
        <p className="text-muted-foreground mb-2 text-sm">
          Estamos gerando o seu currículo otimizado para a vaga.
        </p>
        <p className="text-xs text-muted-foreground/60 mb-8">
          Essa tela atualiza sozinha quando a geração terminar.
        </p>

        <div className="w-full max-w-xs space-y-2 mb-10">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-500 ${
                i === stepIdx
                  ? "bg-primary/10 border border-primary/30"
                  : i < stepIdx
                  ? "opacity-40"
                  : "opacity-20"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                i < stepIdx ? "bg-primary/60" : i === stepIdx ? "bg-primary animate-pulse" : "bg-border"
              }`} />
              <span className={`text-sm ${i === stepIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {i === stepIdx ? `${s}${".".repeat(dotCount)}` : s}
              </span>
            </div>
          ))}
        </div>

        {isError && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
            Ocorreu um erro na geração. Por favor, tente novamente.
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Travou ou demorou demais?</p>
          <SupportButton />
        </div>
      </div>
    </FunnelLayout>
  );
}
