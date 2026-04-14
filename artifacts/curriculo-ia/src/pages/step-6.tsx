import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, ContinueButton, SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { Lightbulb } from "lucide-react";

const genericJobDescription = `Analista de Marketing Digital

Responsabilidades:
- Planejar e executar campanhas de marketing digital (Google Ads, Meta Ads)
- Gerenciar redes sociais e criar conteúdo estratégico
- Analisar métricas e KPIs de performance
- Otimizar campanhas para conversão e ROI

Requisitos:
- Formação em Marketing, Comunicação ou áreas relacionadas
- Experiência com Google Analytics, Google Ads e Meta Business Suite
- Conhecimento em SEO e SEM
- Habilidade com ferramentas de design (Canva, Adobe)
- Inglês intermediário`;

export default function Step6() {
  const [, setLocation] = useLocation();
  const { updateData, session } = useFunnel();
  const [jobDescription, setJobDescription] = useState(session?.jobDescription || "");
  const [jobTitle, setJobTitle] = useState(session?.jobTitle || "");
  const [company, setCompany] = useState(session?.company || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!jobDescription.trim()) return;
    setIsLoading(true);
    await updateData({
      jobDescription: jobDescription.trim(),
      jobTitle: jobTitle.trim() || undefined,
      company: company.trim() || undefined,
    });
    setLocation("/step/7");
  };

  return (
    <FunnelLayout step={6}>
      <FunnelHeader />

      <div className="mt-6 mb-4">
        <h2 className="text-lg font-bold text-foreground">Cole a vaga que você quer conquistar</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cole a descrição completa da vaga. A IA vai adaptar seu currículo para dar match nela.
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Título da vaga (opcional)</label>
          <input
            data-testid="input-job-title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Ex: Desenvolvedor Backend Sênior"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Empresa (opcional)</label>
          <input
            data-testid="input-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ex: Nubank"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Descrição da vaga *</label>
          <textarea
            data-testid="input-job-description"
            rows={9}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Cole aqui a descrição completa da vaga: título, responsabilidades, requisitos e tecnologias..."
            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
          />
        </div>
      </div>

      <button
        data-testid="button-use-template"
        onClick={() => setJobDescription(genericJobDescription)}
        className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 mb-4 block"
      >
        Não tem uma vaga específica? Use um modelo
      </button>

      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/40 bg-card/50 mb-5">
        <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Quanto mais detalhes você fornecer sobre a vaga, melhor a IA conseguirá destacar experiências, palavras-chave e skills relevantes.
        </p>
      </div>

      <div className="text-center mb-5">
        <p className="text-xs text-muted-foreground mb-1">Não sabe qual vaga colar aqui?</p>
        <SupportButton />
      </div>

      <ContinueButton
        disabled={!jobDescription.trim() || isLoading}
        onClick={handleContinue}
      />
    </FunnelLayout>
  );
}
