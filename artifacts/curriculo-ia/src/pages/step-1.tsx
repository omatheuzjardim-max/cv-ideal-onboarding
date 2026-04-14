import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, OptionCard, ContinueButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";

const options = [
  { value: "entrevista", title: "Conseguir uma entrevista", description: "Quero ser chamado para processos seletivos" },
  { value: "carreira", title: "Mudar de carreira", description: "Estou em transição para uma nova área" },
  { value: "aumento", title: "Negociar um aumento", description: "Quero valorizar meu perfil atual" },
  { value: "retorno", title: "Voltar ao mercado", description: "Estou retornando após um período fora" },
];

export default function Step1() {
  const [, setLocation] = useLocation();
  const { updateData, session } = useFunnel();
  const [selected, setSelected] = useState(session?.careerGoal || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    await updateData({ careerGoal: selected });
    setLocation("/step/2");
  };

  return (
    <FunnelLayout step={1}>
      <FunnelHeader badge="Currículo otimizado por IA" />

      <div className="mt-6 mb-4">
        <h2 className="text-lg font-bold text-foreground">Qual seu objetivo agora?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Isso nos ajuda a personalizar seu currículo para o momento certo da sua carreira.
        </p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => setSelected(opt.value)}
            title={opt.title}
            description={opt.description}
            data-testid={`card-goal-${opt.value}`}
          />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <ContinueButton
          disabled={!selected || isLoading}
          onClick={handleContinue}
        />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">+2.300 currículos gerados essa semana</p>
        </div>
      </div>
    </FunnelLayout>
  );
}
