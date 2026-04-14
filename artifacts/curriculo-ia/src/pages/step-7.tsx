import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { useGenerateResume } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

const templates = [
  {
    value: "moderno",
    title: "Moderno",
    description: "Limpo e direto. Layout alinhado à esquerda. Perfeito para tecnologia e startups.",
    preview: (
      <div className="w-full rounded border border-border/60 bg-card p-2 space-y-1.5">
        <div className="h-2 w-1/2 bg-primary rounded" />
        <div className="h-1.5 w-1/3 bg-primary/40 rounded" />
        <div className="h-px bg-border/60" />
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-muted/60 rounded" />
          <div className="h-1.5 w-4/5 bg-muted/60 rounded" />
          <div className="h-1.5 w-3/4 bg-muted/60 rounded" />
        </div>
        <div className="h-1.5 w-1/4 bg-primary/60 rounded mt-2" />
        <div className="flex flex-wrap gap-1">
          {["React", "Node", "AWS"].map(s => (
            <span key={s} className="px-1 py-0.5 text-[8px] bg-primary/10 text-primary rounded-full border border-primary/20">{s}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    value: "classico",
    title: "Clássico",
    description: "Elegante e tradicional. Ideal para áreas jurídicas e corporativas.",
    preview: (
      <div className="w-full rounded border border-border/60 bg-card p-2 space-y-1.5">
        <div className="text-center space-y-1">
          <div className="h-2 w-1/2 bg-foreground/70 rounded mx-auto" />
          <div className="h-1.5 w-1/3 bg-muted/70 rounded mx-auto" />
          <div className="h-px bg-foreground/30" />
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-muted/60 rounded" />
          <div className="h-1.5 w-5/6 bg-muted/60 rounded" />
          <div className="h-1.5 w-4/5 bg-muted/60 rounded" />
        </div>
        <div className="h-1.5 w-1/3 bg-foreground/40 rounded uppercase" />
        <div className="space-y-0.5">
          <div className="h-1.5 w-full bg-muted/50 rounded" />
          <div className="h-1.5 w-3/4 bg-muted/50 rounded" />
        </div>
      </div>
    ),
  },
];

export default function Step7() {
  const [, setLocation] = useLocation();
  const { updateData, sessionId } = useFunnel();
  const generateResume = useGenerateResume();
  const [selected, setSelected] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (value: string) => {
    if (isLoading) return;
    setSelected(value);
    setIsLoading(true);
    await updateData({ templateChoice: value });
    generateResume.mutate(
      { sessionId: sessionId! },
      {
        onSuccess: () => setLocation("/generation"),
        onError: () => {
          setIsLoading(false);
          setSelected("");
        },
      }
    );
  };

  return (
    <FunnelLayout step={7}>
      <FunnelHeader />

      <div className="mt-6 mb-5">
        <h2 className="text-lg font-bold text-foreground">Escolha o modelo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o layout que melhor destaca sua experiência.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {templates.map((tpl) => (
          <button
            key={tpl.value}
            data-testid={`card-template-${tpl.value}`}
            onClick={() => handleSelect(tpl.value)}
            disabled={isLoading}
            className={`text-left p-3 rounded-xl border transition-all duration-200 ${
              selected === tpl.value
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                : "border-border/60 bg-card hover:border-primary/40"
            } disabled:opacity-60`}
          >
            <div className="mb-3">{tpl.preview}</div>
            <div className={`font-semibold text-sm ${selected === tpl.value ? "text-primary" : "text-foreground"}`}>
              {tpl.title}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{tpl.description}</div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Iniciando geração...</span>
        </div>
      )}

      <div className="text-center mt-4">
        <p className="text-xs text-muted-foreground mb-1">Está em dúvida sobre o modelo?</p>
        <SupportButton />
      </div>
    </FunnelLayout>
  );
}
