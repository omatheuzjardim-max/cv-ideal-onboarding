import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, ContinueButton } from "@/components/funnel-layout";
import { CheckCircle } from "lucide-react";

const benefits = [
  "Analisa a vaga e encaixa as palavras-chave mais importantes",
  "Destaca sua experiência de forma mais relevante para o recrutador",
  "Entrega um currículo mais limpo, profissional e pronto para ATS",
];

export default function Step4() {
  const [, setLocation] = useLocation();

  return (
    <FunnelLayout step={4}>
      <FunnelHeader />

      <div className="mt-6 mb-5">
        <h2 className="text-xl font-bold text-foreground leading-tight">
          Vamos gerar um currículo otimizado para essa vaga
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          O sistema lê a descrição da vaga e reorganiza seu currículo para aumentar suas chances de passar nos filtros e chamar atenção do recrutador.
        </p>
      </div>

      <div className="grid gap-3 mb-6">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Seu currículo base</div>
          <p className="text-sm text-muted-foreground">
            A gente parte das suas informações e da vaga que você quer conquistar.
          </p>
        </div>
        <div className="flex items-center justify-center py-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-px h-3 bg-primary/40" />
            <div className="w-2 h-2 rotate-45 border-r border-b border-primary/60" />
          </div>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Otimização por vaga</div>
          <p className="text-sm text-muted-foreground">
            A IA prioriza o que faz mais sentido para aquela oportunidade, sem você precisar refazer tudo manualmente.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 mb-6">
        <div className="space-y-2.5">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-snug">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-6 leading-relaxed">
        Em poucos passos, você vai sair daqui com um currículo mais forte para a vaga certa.
      </p>

      <ContinueButton onClick={() => setLocation("/step/5")} label="Entendi, vamos lá" />
    </FunnelLayout>
  );
}
