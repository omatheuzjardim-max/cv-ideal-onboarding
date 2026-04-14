import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, OptionCard, ContinueButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";

const options = [
  { value: "zero", title: "Nenhum ainda", description: "Estou começando agora" },
  { value: "1-5", title: "1 a 5", description: "Algumas candidaturas" },
  { value: "6-10", title: "6 a 10", description: "Estou ativo na busca" },
  { value: "10+", title: "Mais de 10", description: "Candidatando bastante" },
];

export default function Step2() {
  const [, setLocation] = useLocation();
  const { updateData, session } = useFunnel();
  const [selected, setSelected] = useState(session?.applicationVolume || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    await updateData({ applicationVolume: selected });
    setLocation("/step/3");
  };

  return (
    <FunnelLayout step={2}>
      <FunnelHeader />

      <div className="mt-6 mb-4">
        <h2 className="text-lg font-bold text-foreground">Quantos currículos você envia por semana?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Isso nos ajuda a entender seu momento na busca por emprego.
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
            data-testid={`card-volume-${opt.value}`}
          />
        ))}
      </div>

      <div className="mt-6">
        <ContinueButton disabled={!selected || isLoading} onClick={handleContinue} />
      </div>
    </FunnelLayout>
  );
}
