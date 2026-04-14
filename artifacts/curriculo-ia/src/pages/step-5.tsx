import { useState } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, ContinueButton, SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { useImportLinkedin } from "@workspace/api-client-react";
import { Loader2, Plus, X, Copy, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

const STEPS_COPY = [
  { icon: "1", text: "Abra seu perfil no LinkedIn no computador" },
  { icon: "2", text: 'Clique em qualquer área da página e pressione Ctrl+A (ou Cmd+A no Mac) para selecionar tudo' },
  { icon: "3", text: "Copie com Ctrl+C (ou Cmd+C) e cole abaixo" },
];

export default function Step5() {
  const [, setLocation] = useLocation();
  const { updateData, session, sessionId } = useFunnel();
  const importLinkedin = useImportLinkedin();

  const [activeTab, setActiveTab] = useState<"linkedin" | "manual">("linkedin");
  const [isLoading, setIsLoading] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(session?.linkedinUrl || "");
  const [rawProfileText, setRawProfileText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importError, setImportError] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);

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

  const canContinue =
    activeTab === "linkedin"
      ? importStatus === "success"
      : form.fullName && form.email && form.currentRole;

  const handleLinkedinImport = async () => {
    if (!sessionId || rawProfileText.trim().length < 50) {
      setImportError("Cole o texto completo do seu perfil do LinkedIn antes de importar.");
      return;
    }
    setImportStatus("loading");
    setImportError("");

    importLinkedin.mutate(
      { sessionId, data: { linkedinUrl: linkedinUrl || undefined, rawProfileText } },
      {
        onSuccess: (result) => {
          if (result.success && result.profile) {
            const p = result.profile as Record<string, unknown>;
            setForm({
              fullName: (p.fullName as string) || "",
              email: (p.email as string) || "",
              phone: (p.phone as string) || "",
              location: (p.location as string) || "",
              linkedinUrl: linkedinUrl || (p.linkedinUrl as string) || "",
              portfolioUrl: (p.portfolioUrl as string) || "",
              summary: (p.summary as string) || "",
              currentRole: (p.currentRole as string) || "",
            });
            if (p.skills) setSkills(p.skills as string[]);
            if (p.experiences) setExperiences(p.experiences as Experience[]);
            setImportStatus("success");
          } else {
            setImportStatus("error");
            setImportError("Não foi possível extrair os dados. Verifique se o texto colado é completo.");
          }
        },
        onError: () => {
          setImportStatus("error");
          setImportError("Erro ao processar. Tente novamente ou use o preenchimento manual.");
        },
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

  const addExperience = () =>
    setExperiences([...experiences, { title: "", company: "", period: "", description: "" }]);

  const updateExperience = (i: number, field: keyof Experience, value: string) =>
    setExperiences(experiences.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));

  const removeExperience = (i: number) =>
    setExperiences(experiences.filter((_, idx) => idx !== i));

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
        <h2 className="text-lg font-bold text-foreground">Seu perfil profissional</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Este é o ponto de partida — usamos seu perfil para criar versões sob medida por vaga.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-card border border-border/60">
        {([["linkedin", "Importar do LinkedIn"], ["manual", "Preencher manualmente"]] as const).map(([tab, label]) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => { setActiveTab(tab); setImportStatus("idle"); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* LinkedIn import tab */}
      {activeTab === "linkedin" && importStatus !== "success" && (
        <div className="mb-5 space-y-4">

          {/* Instruction accordion */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-primary" />
                Como copiar seu perfil do LinkedIn?
              </span>
              {showInstructions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showInstructions && (
              <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
                {STEPS_COPY.map((s) => (
                  <div key={s.icon} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {s.icon}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{s.text}</p>
                  </div>
                ))}
                <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary font-medium">
                    Dica: Acesse seu perfil em{" "}
                    <a
                      href="https://www.linkedin.com/in/me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      linkedin.com/in/me
                    </a>
                    {" "}e copie tudo com Ctrl+A → Ctrl+C
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Optional URL */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              URL do LinkedIn <span className="text-muted-foreground/60">(opcional)</span>
            </label>
            <input
              data-testid="input-linkedin-url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/seu-usuario"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Paste area */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Cole o texto do seu perfil aqui <span className="text-destructive">*</span>
            </label>
            <textarea
              data-testid="input-raw-profile-text"
              rows={10}
              value={rawProfileText}
              onChange={(e) => { setRawProfileText(e.target.value); setImportStatus("idle"); setImportError(""); }}
              placeholder="Selecione tudo no seu perfil do LinkedIn (Ctrl+A) e cole aqui (Ctrl+V)..."
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground/60">
                {rawProfileText.length > 0 ? `${rawProfileText.length} caracteres` : ""}
              </span>
              {rawProfileText.length > 50 && (
                <span className="text-xs text-primary">✓ Texto detectado</span>
              )}
            </div>
          </div>

          {importError && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive">
              {importError}
            </div>
          )}

          <button
            data-testid="button-import-linkedin"
            onClick={handleLinkedinImport}
            disabled={rawProfileText.trim().length < 50 || importStatus === "loading"}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importStatus === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extraindo dados com IA...
              </>
            ) : (
              "Importar perfil"
            )}
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Prefiro preencher manualmente →
          </button>
        </div>
      )}

      {/* Success state — show extracted fields for review */}
      {activeTab === "linkedin" && importStatus === "success" && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Perfil importado com sucesso!</p>
              <p className="text-xs text-muted-foreground">Revise os dados abaixo e corrija se precisar.</p>
            </div>
          </div>
          {renderFormFields(form, setForm, experiences, addExperience, updateExperience, removeExperience, skills, newSkill, setNewSkill, addSkill, removeSkill)}
        </div>
      )}

      {/* Manual tab */}
      {activeTab === "manual" && (
        <div className="mb-5 space-y-3">
          {renderFormFields(form, setForm, experiences, addExperience, updateExperience, removeExperience, skills, newSkill, setNewSkill, addSkill, removeSkill)}
        </div>
      )}

      <div className="p-3 rounded-xl border border-border/40 bg-card/50 mb-5 text-center">
        <p className="text-xs text-muted-foreground">Precisa de ajuda?</p>
        <SupportButton />
      </div>

      <ContinueButton disabled={!canContinue || isLoading} onClick={handleContinue} />
    </FunnelLayout>
  );
}

function renderFormFields(
  form: Record<string, string>,
  setForm: (f: Record<string, string>) => void,
  experiences: Experience[],
  addExperience: () => void,
  updateExperience: (i: number, field: keyof Experience, value: string) => void,
  removeExperience: (i: number) => void,
  skills: string[],
  newSkill: string,
  setNewSkill: (v: string) => void,
  addSkill: () => void,
  removeSkill: (i: number) => void,
) {
  const fields = [
    { label: "Nome completo *", key: "fullName", placeholder: "João Silva", testid: "input-full-name" },
    { label: "Cargo atual ou objetivo *", key: "currentRole", placeholder: "Desenvolvedor Full Stack", testid: "input-current-role" },
    { label: "Email *", key: "email", placeholder: "joao@email.com", testid: "input-email" },
    { label: "Telefone", key: "phone", placeholder: "+55 11 99999-9999", testid: "input-phone" },
    { label: "Localização", key: "location", placeholder: "São Paulo, SP", testid: "input-location" },
    { label: "LinkedIn", key: "linkedinUrl", placeholder: "https://linkedin.com/in/...", testid: "input-linkedin" },
    { label: "Site ou portfólio", key: "portfolioUrl", placeholder: "https://seusite.com", testid: "input-portfolio" },
  ];

  return (
    <>
      {fields.map(({ label, key, placeholder, testid }) => (
        <div key={key}>
          <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
          <input
            data-testid={testid}
            type="text"
            value={form[key] || ""}
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
          value={form.summary || ""}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="Profissional com X anos de experiência em..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
        />
      </div>

      {/* Experiences */}
      <div className="pt-1">
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
                value={exp.title}
                onChange={(e) => updateExperience(i, "title", e.target.value)}
                placeholder="Cargo"
                className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary col-span-2"
              />
              <input
                value={exp.company}
                onChange={(e) => updateExperience(i, "company", e.target.value)}
                placeholder="Empresa"
                className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={exp.period}
                onChange={(e) => updateExperience(i, "period", e.target.value)}
                placeholder="2022 – presente"
                className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <textarea
              value={exp.description}
              onChange={(e) => updateExperience(i, "description", e.target.value)}
              placeholder="Principais responsabilidades e realizações..."
              rows={2}
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="pt-1">
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary"
            >
              {skill}
              <button onClick={() => removeSkill(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
