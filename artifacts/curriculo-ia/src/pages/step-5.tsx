import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, ContinueButton, SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { useImportLinkedin } from "@workspace/api-client-react";
import { Loader2, Plus, X } from "lucide-react";

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export default function Step5() {
  const [, setLocation] = useLocation();
  const { updateData, session, sessionId } = useFunnel();
  const importLinkedin = useImportLinkedin();
  const [activeTab, setActiveTab] = useState<"linkedin" | "pdf" | "manual">("manual");
  const [isLoading, setIsLoading] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(session?.linkedinUrl || "");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const structured = session?.structuredProfileJson as Record<string, unknown> | null | undefined;

  const [form, setForm] = useState({
    fullName: session?.fullName || (structured?.fullName as string) || "",
    email: session?.email || (structured?.email as string) || "",
    phone: session?.phone || (structured?.phone as string) || "",
    location: session?.location || (structured?.location as string) || "",
    linkedinUrl: session?.linkedinUrl || "",
    portfolioUrl: session?.portfolioUrl || "",
    summary: session?.summary || (structured?.summary as string) || "",
    currentRole: (structured?.currentRole as string) || "",
  });
  const [skills, setSkills] = useState<string[]>((structured?.skills as string[]) || []);
  const [experiences, setExperiences] = useState<Experience[]>((structured?.experiences as Experience[]) || []);
  const [newSkill, setNewSkill] = useState("");

  const canContinue = form.fullName && form.email && form.currentRole && (form.summary || experiences.length > 0);

  const handleLinkedinImport = async () => {
    if (!linkedinUrl || !sessionId) return;
    setImportStatus("loading");
    importLinkedin.mutate(
      { sessionId, data: { linkedinUrl } },
      {
        onSuccess: (result) => {
          if (result.success && result.profile) {
            const p = result.profile as Record<string, unknown>;
            setForm({
              fullName: (p.fullName as string) || form.fullName,
              email: (p.email as string) || form.email,
              phone: (p.phone as string) || form.phone,
              location: (p.location as string) || form.location,
              linkedinUrl: linkedinUrl,
              portfolioUrl: (p.portfolioUrl as string) || form.portfolioUrl,
              summary: (p.summary as string) || form.summary,
              currentRole: (p.currentRole as string) || form.currentRole,
            });
            if (p.skills) setSkills(p.skills as string[]);
            if (p.experiences) setExperiences(p.experiences as Experience[]);
            setImportStatus("success");
          } else {
            setImportStatus("error");
          }
        },
        onError: () => setImportStatus("error"),
      }
    );
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (i: number) => setSkills(skills.filter((_, idx) => idx !== i));

  const addExperience = () => {
    setExperiences([...experiences, { title: "", company: "", period: "", description: "" }]);
  };

  const updateExperience = (i: number, field: keyof Experience, value: string) => {
    setExperiences(experiences.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const removeExperience = (i: number) => setExperiences(experiences.filter((_, idx) => idx !== i));

  const handleContinue = async () => {
    setIsLoading(true);
    const profileJson = {
      fullName: form.fullName,
      currentRole: form.currentRole,
      email: form.email,
      phone: form.phone,
      location: form.location,
      linkedinUrl: form.linkedinUrl,
      portfolioUrl: form.portfolioUrl,
      summary: form.summary,
      experiences,
      skills,
    };
    await updateData({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      location: form.location,
      linkedinUrl: form.linkedinUrl,
      portfolioUrl: form.portfolioUrl,
      summary: form.summary,
      profileSourceType: activeTab,
      structuredProfileJson: profileJson,
    });
    setLocation("/step/6");
  };

  return (
    <FunnelLayout step={5}>
      <FunnelHeader />

      <div className="mt-6 mb-4">
        <h2 className="text-lg font-bold text-foreground">Perfil base</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Suas informações — Esse é o perfil base que vamos usar para criar versões sob medida por vaga.
        </p>
      </div>

      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-card border border-border/60">
        {(["linkedin", "pdf", "manual"] as const).map((tab) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "linkedin" ? "LinkedIn" : tab === "pdf" ? "PDF / Imagem" : "Manual"}
          </button>
        ))}
      </div>

      {activeTab === "linkedin" && (
        <div className="mb-5 p-4 rounded-xl border border-border/60 bg-card">
          <label className="text-xs font-semibold text-muted-foreground block mb-2">URL do LinkedIn</label>
          <div className="flex gap-2">
            <input
              data-testid="input-linkedin-url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/seu-perfil"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              data-testid="button-import-linkedin"
              onClick={handleLinkedinImport}
              disabled={!linkedinUrl || importStatus === "loading"}
              className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {importStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importar"}
            </button>
          </div>
          {importStatus === "success" && (
            <p className="text-xs text-primary mt-2">Perfil importado. Revise os campos abaixo.</p>
          )}
          {importStatus === "error" && (
            <p className="text-xs text-destructive mt-2">Erro ao importar. Preencha manualmente.</p>
          )}
        </div>
      )}

      {activeTab === "pdf" && (
        <div className="mb-5 p-4 rounded-xl border border-dashed border-border bg-card/50 text-center">
          <p className="text-sm text-muted-foreground">Extração de PDF disponível em breve.</p>
          <p className="text-xs text-muted-foreground mt-1">Por favor, preencha os campos manualmente abaixo.</p>
        </div>
      )}

      <div className="space-y-3 mb-5">
        {[
          { label: "Nome completo *", key: "fullName", placeholder: "João Silva", testid: "input-full-name" },
          { label: "Cargo atual ou objetivo *", key: "currentRole", placeholder: "Desenvolvedor Full Stack", testid: "input-current-role" },
          { label: "Email *", key: "email", placeholder: "joao@email.com", testid: "input-email" },
          { label: "Telefone", key: "phone", placeholder: "+55 11 99999-9999", testid: "input-phone" },
          { label: "Localização", key: "location", placeholder: "São Paulo, SP", testid: "input-location" },
          { label: "LinkedIn", key: "linkedinUrl", placeholder: "https://linkedin.com/in/...", testid: "input-linkedin" },
          { label: "Site ou portfólio", key: "portfolioUrl", placeholder: "https://seusite.com", testid: "input-portfolio" },
        ].map(({ label, key, placeholder, testid }) => (
          <div key={key}>
            <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
            <input
              data-testid={testid}
              type="text"
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Resumo profissional</label>
          <textarea
            data-testid="input-summary"
            rows={4}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Profissional com X anos de experiência em..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
          />
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Experiências ({experiences.length})</span>
          <button data-testid="button-add-experience" onClick={addExperience} className="flex items-center gap-1 text-xs text-primary">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-3 p-3 rounded-lg border border-border/60 bg-card relative">
            <button onClick={() => removeExperience(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                data-testid={`input-exp-title-${i}`}
                value={exp.title}
                onChange={(e) => updateExperience(i, "title", e.target.value)}
                placeholder="Cargo"
                className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary col-span-2"
              />
              <input
                data-testid={`input-exp-company-${i}`}
                value={exp.company}
                onChange={(e) => updateExperience(i, "company", e.target.value)}
                placeholder="Empresa"
                className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                data-testid={`input-exp-period-${i}`}
                value={exp.period}
                onChange={(e) => updateExperience(i, "period", e.target.value)}
                placeholder="2022 – presente"
                className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <textarea
              data-testid={`input-exp-desc-${i}`}
              value={exp.description}
              onChange={(e) => updateExperience(i, "description", e.target.value)}
              placeholder="Principais responsabilidades..."
              rows={2}
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Skills ({skills.length})</span>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            data-testid="input-skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            placeholder="Ex: React, Python, Excel..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            data-testid="button-add-skill"
            onClick={addSkill}
            className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg"
          >
            Adicionar
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, i) => (
            <span
              key={i}
              data-testid={`tag-skill-${i}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary"
            >
              {skill}
              <button onClick={() => removeSkill(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl border border-border/40 bg-card/50 mb-5 text-center">
        <p className="text-xs text-muted-foreground">Precisa de ajuda para importar ou preencher seu perfil?</p>
        <SupportButton />
      </div>

      <ContinueButton
        disabled={!canContinue || isLoading}
        onClick={handleContinue}
      />
    </FunnelLayout>
  );
}
