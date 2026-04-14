import { useLocation } from "wouter";
import { FunnelLayout } from "@/components/funnel-layout";
import { SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { useCreateCheckout } from "@workspace/api-client-react";
import { Lock, Star, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

const testimonials = [
  { name: "Ana Costa", role: "Engenheira de Software", text: "Consegui 3 entrevistas em uma semana depois de otimizar meu currículo.", stars: 5 },
  { name: "Rafael Lima", role: "Analista de Marketing", text: "O score ATS subiu de 45 para 82. Finalmente estou passando nos filtros.", stars: 5 },
  { name: "Mariana Souza", role: "Gerente de Projetos", text: "Valia cada centavo. Muito mais eficiente do que reescrever tudo na mão.", stars: 5 },
];

export default function Preview() {
  const [, setLocation] = useLocation();
  const { sessionId, session } = useFunnel();
  const createCheckout = useCreateCheckout();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");

  const atsScore = session?.atsScore ?? 72;
  const jobAnalysis = session?.jobAnalysisJson as Record<string, unknown> | null ?? null;
  const previewResume = session?.previewResumeJson as Record<string, unknown> | null ?? null;

  const keywordsFound = (jobAnalysis?.keywordsFound as string[]) ?? ["gestão", "liderança", "comunicação"];
  const keywordsMissing = (jobAnalysis?.keywordsMissing as string[]) ?? ["Scrum", "Agile"];
  const improvements = (jobAnalysis?.mainImprovements as string[]) ?? [
    "Palavras-chave da vaga integradas ao resumo",
    "Experiências reordenadas por relevância",
    "Formato ATS-friendly aplicado",
  ];

  const handleUnlock = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    createCheckout.mutate(
      { sessionId },
      {
        onSuccess: (data) => {
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          }
        },
        onError: () => setIsLoading(false),
      }
    );
  };

  const scoreColor = atsScore >= 75 ? "text-primary" : atsScore >= 50 ? "text-yellow-400" : "text-destructive";
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (atsScore / 100) * circumference;

  return (
    <FunnelLayout showProgress={false}>
      <div className="py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Currículo profissional</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            Veja a prévia inicial e desbloqueie a geração completa para editar e baixar o PDF final.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6 p-4 rounded-xl border border-border/60 bg-card">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>{atsScore}</span>
              <span className="text-[10px] text-muted-foreground">ATS</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Score ATS estimado</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seu currículo foi otimizado para passar pelos filtros automáticos desta vaga.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Encontradas</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {keywordsFound.slice(0, 5).map((kw) => (
                <span key={kw} className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded border border-primary/20">{kw}</span>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-destructive/80" />
              <span className="text-xs font-semibold text-destructive/80">Faltando</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {keywordsMissing.slice(0, 5).map((kw) => (
                <span key={kw} className="px-1.5 py-0.5 text-[10px] bg-destructive/10 text-destructive/80 rounded border border-destructive/20">{kw}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5 p-3 rounded-xl border border-border/60 bg-card">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">Melhorias aplicadas</span>
          <div className="space-y-1.5">
            {improvements.map((imp) => (
              <div key={imp} className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-xs text-muted-foreground">{imp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-card p-1">
          {([
            ["preview", "Previa"],
            ["editor", "Editor"],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md py-2 text-xs font-semibold transition-all ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative mb-5 rounded-xl border border-border/60 overflow-hidden">
          {activeTab === "preview" ? (
          <div className="p-4 blur-sm select-none pointer-events-none" aria-hidden>
            <div className="font-bold text-base text-foreground mb-0.5">{previewResume?.fullName || "Nome do Candidato"}</div>
            <div className="text-xs text-primary mb-2">{previewResume?.currentRole || "Cargo Profissional"}</div>
            <div className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-3">
              {(previewResume?.summary as string) || "Profissional com sólida experiência em sua área de atuação, com histórico comprovado de resultados e forte capacidade de adaptação às demandas do mercado."}
            </div>
            <div className="h-px bg-border/40 mb-2" />
            <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Experiência</div>
            {["Cargo Sênior", "Cargo Pleno", "Cargo Júnior"].map((c) => (
              <div key={c} className="mb-2">
                <div className="text-xs font-semibold text-foreground">{c}</div>
                <div className="text-[10px] text-muted-foreground">Empresa • 2020 – 2023</div>
              </div>
            ))}
            <div className="h-px bg-border/40 mb-2" />
            <div className="flex flex-wrap gap-1">
              {["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"].map(s => (
                <span key={s} className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">{s}</span>
              ))}
            </div>
          </div>
          ) : (
            <div className="p-4 blur-sm select-none pointer-events-none" aria-hidden>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-3">Editor bloqueado</div>
              <div className="space-y-3">
                <div className="h-9 rounded-lg bg-muted/70" />
                <div className="h-24 rounded-lg bg-muted/60" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-9 rounded-lg bg-muted/60" />
                  <div className="h-9 rounded-lg bg-muted/60" />
                </div>
                <div className="h-20 rounded-lg bg-muted/50" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-sm font-bold text-foreground mb-1">Currículo bloqueado</div>
              <div className="text-xs text-muted-foreground leading-snug max-w-xs">
                Desbloqueie para remover o blur, liberar a edição completa e baixar o PDF final.
              </div>
            </div>
          </div>

          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-primary/80 rotate-12">
            PRÉVIA
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
          Esta é uma prévia inicial com blur e marca d'água. Depois do desbloqueio você libera a versão completa e o PDF final.
        </p>

        <div className="mb-5 p-4 rounded-xl border border-border/60 bg-card">
          <div className="font-semibold text-sm text-foreground mb-2">O que você recebe:</div>
          {[
            "Versão completa sem blur",
            "Currículo otimizado por vaga",
            "Score ATS e melhorias aplicadas",
            "PDF final pronto para baixar",
            "Edição final do conteúdo liberada",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 py-1">
              <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>

        <button
          data-testid="button-unlock"
          onClick={handleUnlock}
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 mb-3"
        >
          {isLoading ? "Redirecionando..." : "Desbloquear por R$ 19,90"}
        </button>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">
            Garantia de qualidade: se você não gostar do resultado, devolvemos seu dinheiro.
          </p>
        </div>

        <div className="mb-5 p-3 rounded-xl border border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
            </div>
            <span className="text-xs font-semibold text-foreground">4.8</span>
            <span className="text-xs text-muted-foreground">· 847 avaliações</span>
          </div>
          <div className="space-y-3">
            {testimonials.map((t) => (
              <div key={t.name} className="p-2.5 rounded-lg bg-background border border-border/40">
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-xs text-muted-foreground mb-1 leading-relaxed">"{t.text}"</p>
                <div className="text-[10px] font-semibold text-foreground">{t.name} · <span className="font-normal text-muted-foreground">{t.role}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Precisa de ajuda com esse currículo?</p>
          <SupportButton />
        </div>
      </div>
    </FunnelLayout>
  );
}
