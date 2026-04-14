import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, OptionCard, ContinueButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";

const options = [
  { value: "poucas", title: "Sim, mas poucas", description: "Vamos aumentar suas chances." },
  { value: "nenhuma", title: "Não, quase nenhuma", description: "Seu currículo pode estar sendo descartado." },
];

export default function Step3() {
  const [, setLocation] = useLocation();
  const { updateData, session } = useFunnel();
  const [selected, setSelected] = useState(session?.interviewRate || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    await updateData({ interviewRate: selected });
    setLocation("/step/4");
  };

  return (
    <FunnelLayout step={3}>
      <FunnelHeader />

      <div className="mt-6 mb-4">
        <h2 className="text-lg font-bold text-foreground">Você está recebendo entrevistas?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Seja honesto. Isso nos ajuda a posicionar melhor seu currículo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => setSelected(opt.value)}
            title={opt.title}
            description={opt.description}
            data-testid={`card-interview-${opt.value}`}
          />
        ))}
      </div>

      {selected && (
        <div className="mt-6 rounded-xl border border-border/60 bg-card p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive/80" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">O problema</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Grande parte dos currículos é descartada por robôs ATS antes de um recrutador ver. Esses sistemas procuram palavras-chave e uma estrutura que faça sentido para a vaga.
            </p>
          </div>
          <div className="h-px bg-border/40" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">A solução</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nossa IA lê a vaga e reorganiza seu currículo para aumentar a aderência, destacar o que importa e melhorar suas chances de passar nos filtros.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <ContinueButton disabled={!selected || isLoading} onClick={handleContinue} />
      </div>
    </FunnelLayout>
  );
}
