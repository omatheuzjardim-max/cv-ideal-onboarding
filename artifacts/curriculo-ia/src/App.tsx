import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FunnelProvider } from "@/hooks/use-funnel";
import NotFound from "@/pages/not-found";

import Step1 from "@/pages/step-1";
import Step2 from "@/pages/step-2";
import Step3 from "@/pages/step-3";
import Step4 from "@/pages/step-4";
import Step5 from "@/pages/step-5";
import Step6 from "@/pages/step-6";
import Step7 from "@/pages/step-7";
import Generation from "@/pages/generation";
import Preview from "@/pages/preview";
import Final from "@/pages/final";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/step/1" />} />
      <Route path="/step/1" component={Step1} />
      <Route path="/step/2" component={Step2} />
      <Route path="/step/3" component={Step3} />
      <Route path="/step/4" component={Step4} />
      <Route path="/step/5" component={Step5} />
      <Route path="/step/6" component={Step6} />
      <Route path="/step/7" component={Step7} />
      <Route path="/generation" component={Generation} />
      <Route path="/preview" component={Preview} />
      <Route path="/final" component={Final} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <FunnelProvider>
            <main className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground selection:bg-primary/30">
              <Router />
            </main>
          </FunnelProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
