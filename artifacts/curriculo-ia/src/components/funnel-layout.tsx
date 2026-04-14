import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";

interface FunnelLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

export function FunnelLayout({ children, step, totalSteps = 7, showProgress = true }: FunnelLayoutProps) {
  const progress = step ? (step / totalSteps) * 100 : 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {showProgress && step && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0 tabular-nums">
              {step}/{totalSteps}
            </span>
            <Progress value={progress} className="h-1.5 flex-1" />
          </div>
        </div>
      )}
      <div className={`flex-1 flex flex-col items-center px-4 pb-8 ${showProgress && step ? "pt-14" : "pt-6"}`}>
        <div className="w-full max-w-2xl flex flex-col flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

interface FunnelHeaderProps {
  badge?: string;
}

export function FunnelHeader({ badge }: FunnelHeaderProps) {
  return (
    <div className="text-center pt-6 pb-2">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Gerar currículo por vaga</h1>
      <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
        Monte uma versão mais forte do seu currículo com base na vaga que você quer conquistar.
      </p>
      {badge && (
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">{badge}</span>
        </div>
      )}
    </div>
  );
}

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: string;
  "data-testid"?: string;
}

export function OptionCard({ selected, onClick, title, description, icon, "data-testid": testId }: OptionCardProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
          : "border-border/60 bg-card hover:border-primary/40 hover:bg-card/80"
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && <span className="text-xl mt-0.5 shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm leading-tight ${selected ? "text-primary" : "text-foreground"}`}>
            {title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
        </div>
        <div className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? "border-primary bg-primary" : "border-border"
        }`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

interface ContinueButtonProps {
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  "data-testid"?: string;
}

export function ContinueButton({ disabled, onClick, label = "Continuar", "data-testid": testId }: ContinueButtonProps) {
  return (
    <button
      data-testid={testId || "button-continue"}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        disabled
          ? "bg-primary/30 text-primary/50 cursor-not-allowed"
          : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
      }`}
    >
      {label}
    </button>
  );
}

export function SupportButton() {
  return (
    <a
      href="https://wa.me/5511999999999"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="link-support"
      className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
    >
      Falar com Suporte
    </a>
  );
}
