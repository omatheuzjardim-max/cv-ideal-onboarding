import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { CheckCircle, Download, RefreshCw } from "lucide-react";

function Confetti() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][Math.floor(Math.random() * 5)],
        delay: Math.random() * 2,
        size: Math.random() * 6 + 4,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-bounce"
          style={{
            left: `${p.x}%`,
            top: `-${p.size}px`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `fall ${2 + p.delay}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function Final() {
  const [, setLocation] = useLocation();
  const { sessionId, session, resetSession } = useFunnel();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const finalResume = session?.finalResumeJson as Record<string, unknown> | null ?? null;
  const isPaid = session?.paymentStatus === "paid";

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async () => {
    if (!sessionId || !isPaid) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/download-pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "curriculo-otimizado.html";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isPaid) {
    return (
      <FunnelLayout showProgress={false}>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Confirmando pagamento...</h1>
          <p className="text-sm text-muted-foreground">Aguarde enquanto confirmamos seu pagamento.</p>
        </div>
      </FunnelLayout>
    );
  }

  return (
    <FunnelLayout showProgress={false}>
      {showConfetti && <Confetti />}

      <div className="py-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-4 animate-[bounce_0.6s_ease-out]">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Seu currículo está pronto</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm">
          Seu currículo foi otimizado para a vaga. Baixe agora e comece a candidatar.
        </p>

        <div className="w-full rounded-xl border border-border/60 bg-card p-4 mb-6 text-left">
          <div className="font-bold text-base text-foreground">{finalResume?.fullName || session?.fullName || "Seu Currículo"}</div>
          <div className="text-xs text-primary mt-0.5">{(finalResume?.currentRole as string) || session?.jobTitle || "Profissional"}</div>
          <div className="h-px bg-border/40 my-3" />
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {(finalResume?.summary as string) || session?.summary || "Seu resumo profissional otimizado aparece aqui."}
          </p>
          {finalResume?.skills && (
            <div className="flex flex-wrap gap-1 mt-3">
              {(finalResume.skills as string[]).slice(0, 8).map((skill) => (
                <span key={skill} className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full border border-primary/20">{skill}</span>
              ))}
            </div>
          )}
        </div>

        <button
          data-testid="button-download"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 mb-3"
        >
          <Download className="w-5 h-5" />
          {isDownloading ? "Baixando..." : "Baixar PDF"}
        </button>

        <button
          data-testid="button-new-resume"
          onClick={resetSession}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border/60 bg-card hover:bg-card/80 text-foreground font-medium text-sm transition-all mb-4"
        >
          <RefreshCw className="w-4 h-4" />
          Gerar outro currículo
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Quer salvar seus dados para a próxima vaga? Crie uma conta em breve.
          </p>
        </div>
      </div>
    </FunnelLayout>
  );
}
