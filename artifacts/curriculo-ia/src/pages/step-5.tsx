import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { FunnelLayout, FunnelHeader, ContinueButton, SupportButton } from "@/components/funnel-layout";
import { useFunnel } from "@/hooks/use-funnel";
import { Loader2, Plus, X, Upload, FileText, Image, CheckCircle2, AlertCircle } from "lucide-react";

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  period: string;
}

interface Project {
  name: string;
  description: string;
  url: string;
}

type Tab = "file" | "manual";
type ImportStatus = "idle" | "loading" | "success" | "error";

const ACCEPTED = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const FILE_TYPES = "PDF, Word (DOCX) ou imagem (JPG, PNG)";

const emptyExperience: Experience = { title: "", company: "", period: "", description: "" };
const emptyEducation: Education = { degree: "", institution: "", period: "" };
const emptyProject: Project = { name: "", description: "", url: "" };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asObjectArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function Step5() {
  const [, setLocation] = useLocation();
  const { updateData, session, sessionId } = useFunnel();
  const fileRef = useRef<HTMLInputElement>(null);

  const structured = session?.structuredProfileJson as Record<string, unknown> | null | undefined;

  const [activeTab, setActiveTab] = useState<Tab>("file");
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importError, setImportError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  const [form, setForm] = useState({
    fullName: session?.fullName || (structured?.fullName as string) || "",
    email: session?.email || (structured?.email as string) || "",
    phone: session?.phone || (structured?.phone as string) || "",
    location: session?.location || (structured?.location as string) || "",
    portfolioUrl: session?.portfolioUrl || (structured?.portfolioUrl as string) || "",
    summary: session?.summary || (structured?.summary as string) || "",
    currentRole: (structured?.currentRole as string) || "",
  });
  const [skills, setSkills] = useState<string[]>(asStringArray(structured?.skills));
  const [experiences, setExperiences] = useState<Experience[]>(asObjectArray<Experience>(structured?.experiences));
  const [education, setEducation] = useState<Education[]>(asObjectArray<Education>(structured?.education));
  const [projects, setProjects] = useState<Project[]>(asObjectArray<Project>(structured?.projects));
  const [certifications, setCertifications] = useState<string[]>(asStringArray(structured?.certifications));
  const [languages, setLanguages] = useState<string[]>(asStringArray(structured?.languages));
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const hasValidExperience = experiences.some((exp) => exp.title.trim() && exp.company.trim());
  const hasMinimumProfile = Boolean(
    form.fullName.trim() &&
    form.email.trim() &&
    form.currentRole.trim() &&
    (form.summary.trim() || hasValidExperience)
  );

  const canContinue = hasMinimumProfile;

  const applyImportedProfile = (profile: Record<string, unknown>) => {
    setForm({
      fullName: (profile.fullName as string) || "",
      email: (profile.email as string) || "",
      phone: (profile.phone as string) || "",
      location: (profile.location as string) || "",
      portfolioUrl: (profile.portfolioUrl as string) || "",
      summary: (profile.summary as string) || "",
      currentRole: (profile.currentRole as string) || "",
    });
    setSkills(asStringArray(profile.skills));
    setExperiences(asObjectArray<Experience>(profile.experiences));
    setEducation(asObjectArray<Education>(profile.education));
    setProjects(asObjectArray<Project>(profile.projects));
    setCertifications(asStringArray(profile.certifications));
    setLanguages(asStringArray(profile.languages));
  };

  const processFile = async (file: File) => {
    if (!sessionId) return;
    setFileName(file.name);
    setImportStatus("loading");
    setImportError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/import-file`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success && data.profile) {
        applyImportedProfile(data.profile as Record<string, unknown>);
        setImportStatus("success");
      } else {
        setImportStatus("error");
        setImportError(data.error || "Nao foi possivel extrair os dados. Tente outro arquivo.");
      }
    } catch {
      setImportStatus("error");
      setImportError("Erro de conexao. Verifique sua internet e tente novamente.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsLoading(true);
    const profileJson = {
      fullName: form.fullName,
      currentRole: form.currentRole,
      email: form.email,
      phone: form.phone,
      location: form.location,
      portfolioUrl: form.portfolioUrl,
      summary: form.summary,
      experiences,
      skills,
      education,
      projects,
      certifications,
      languages,
    };

    await updateData({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      location: form.location,
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
          Suas informacoes serao usadas para criar uma versao sob medida por vaga.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-lg bg-card border border-border/60">
        {([
          ["file", "PDF / imagem"],
          ["manual", "Manual"],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            data-testid={`tab-${tab}`}
            onClick={() => {
              setActiveTab(tab);
              setImportStatus("idle");
              setImportError("");
            }}
            className={`py-2 text-xs font-medium rounded-md transition-all ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <Counter label="Experiencias" value={experiences.length} />
        <Counter label="Skills" value={skills.length} />
        <Counter label="Destaques" value={projects.length + certifications.length} />
      </div>

      {activeTab === "file" && (
        <div className="mb-5 space-y-4">
          <input ref={fileRef} type="file" accept={ACCEPTED} onChange={handleFileChange} className="hidden" data-testid="input-file" />
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            disabled={importStatus === "loading"}
            className={`w-full rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center gap-3 cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/10"
                : importStatus === "loading"
                ? "border-border/40 bg-card/50 cursor-not-allowed"
                : "border-border/60 bg-card hover:border-primary/50 hover:bg-primary/5"
            }`}
            data-testid="drop-zone"
          >
            {importStatus === "loading" ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Lendo o arquivo com IA...</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">Toque para enviar seu curriculo</p>
                  <p className="text-xs text-muted-foreground mt-1">{FILE_TYPES}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Tamanho maximo: 10 MB</p>
                </div>
              </>
            )}
          </button>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <FileText className="w-4 h-4" />, label: "PDF" },
              { icon: <FileText className="w-4 h-4" />, label: "Word" },
              { icon: <Image className="w-4 h-4" />, label: "Imagem" },
            ].map((fmt) => (
              <div key={fmt.label} className="flex items-center gap-1.5 p-2.5 rounded-lg border border-border/50 bg-card/50">
                <span className="text-primary/70">{fmt.icon}</span>
                <span className="text-xs text-muted-foreground">{fmt.label}</span>
              </div>
            ))}
          </div>

              <ImportFeedback status={importStatus} error={importError} success="Dados extraidos do arquivo. Revise os campos abaixo antes de continuar." />
          {(importStatus === "success" || hasMinimumProfile) && (
            <FormFields
              form={form}
              setForm={setForm}
              experiences={experiences}
              setExperiences={setExperiences}
              skills={skills}
              setSkills={setSkills}
              newSkill={newSkill}
              setNewSkill={setNewSkill}
              education={education}
              setEducation={setEducation}
              projects={projects}
              setProjects={setProjects}
              certifications={certifications}
              setCertifications={setCertifications}
              newCertification={newCertification}
              setNewCertification={setNewCertification}
              languages={languages}
              setLanguages={setLanguages}
              newLanguage={newLanguage}
              setNewLanguage={setNewLanguage}
            />
          )}
        </div>
      )}

      {activeTab === "manual" && (
        <div className="mb-5 space-y-3">
          <FormFields
            form={form}
            setForm={setForm}
            experiences={experiences}
            setExperiences={setExperiences}
            skills={skills}
            setSkills={setSkills}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            education={education}
            setEducation={setEducation}
            projects={projects}
            setProjects={setProjects}
            certifications={certifications}
            setCertifications={setCertifications}
            newCertification={newCertification}
            setNewCertification={setNewCertification}
            languages={languages}
            setLanguages={setLanguages}
            newLanguage={newLanguage}
            setNewLanguage={setNewLanguage}
          />
        </div>
      )}

      {!canContinue && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">
          Para continuar, informe nome, email, cargo atual ou objetivo, e um resumo profissional ou pelo menos uma experiencia.
        </div>
      )}

      <div className="p-3 rounded-xl border border-border/40 bg-card/50 mb-5 text-center">
        <p className="text-xs text-muted-foreground">Precisa de ajuda para importar ou preencher seu perfil?</p>
        <SupportButton />
      </div>

      <ContinueButton disabled={!canContinue || isLoading} onClick={handleContinue} />
    </FunnelLayout>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
      <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ImportFeedback({ status, error, success }: { status: ImportStatus; error: string; success: string }) {
  if (status === "success") {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/30 bg-primary/5">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">{success}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-destructive/30 bg-destructive/10">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">Nao conseguimos importar</p>
          <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}

interface FormFieldsProps {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  experiences: Experience[];
  setExperiences: (items: Experience[]) => void;
  skills: string[];
  setSkills: (items: string[]) => void;
  newSkill: string;
  setNewSkill: (v: string) => void;
  education: Education[];
  setEducation: (items: Education[]) => void;
  projects: Project[];
  setProjects: (items: Project[]) => void;
  certifications: string[];
  setCertifications: (items: string[]) => void;
  newCertification: string;
  setNewCertification: (v: string) => void;
  languages: string[];
  setLanguages: (items: string[]) => void;
  newLanguage: string;
  setNewLanguage: (v: string) => void;
}

function FormFields(props: FormFieldsProps) {
  const {
    form,
    setForm,
    experiences,
    setExperiences,
    skills,
    setSkills,
    newSkill,
    setNewSkill,
    education,
    setEducation,
    projects,
    setProjects,
    certifications,
    setCertifications,
    newCertification,
    setNewCertification,
    languages,
    setLanguages,
    newLanguage,
    setNewLanguage,
  } = props;

  const fields = [
    { label: "Nome completo *", key: "fullName", placeholder: "Joao Silva", testid: "input-full-name" },
    { label: "Cargo atual ou objetivo *", key: "currentRole", placeholder: "Desenvolvedor Full Stack", testid: "input-current-role" },
    { label: "Email *", key: "email", placeholder: "joao@email.com", testid: "input-email" },
    { label: "Telefone", key: "phone", placeholder: "+55 11 99999-9999", testid: "input-phone" },
    { label: "Localizacao", key: "location", placeholder: "Sao Paulo, SP", testid: "input-location" },
    { label: "Site ou portfolio", key: "portfolioUrl", placeholder: "https://seusite.com", testid: "input-portfolio" },
  ];

  const addListItem = (value: string, setValue: (v: string) => void, list: string[], setList: (items: string[]) => void) => {
    if (!value.trim()) return;
    setList([...list, value.trim()]);
    setValue("");
  };

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
          placeholder="Profissional com X anos de experiencia em..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
        />
      </div>

      <EditableSection title={`Experiencias (${experiences.length})`} onAdd={() => setExperiences([...experiences, { ...emptyExperience }])}>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-3 p-3 rounded-lg border border-border/60 bg-card relative">
            <RemoveButton onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <SmallInput value={exp.title} onChange={(value) => setExperiences(experiences.map((item, idx) => idx === i ? { ...item, title: value } : item))} placeholder="Cargo" className="col-span-2" />
              <SmallInput value={exp.company} onChange={(value) => setExperiences(experiences.map((item, idx) => idx === i ? { ...item, company: value } : item))} placeholder="Empresa" />
              <SmallInput value={exp.period} onChange={(value) => setExperiences(experiences.map((item, idx) => idx === i ? { ...item, period: value } : item))} placeholder="2022 - presente" />
            </div>
            <SmallTextarea value={exp.description} onChange={(value) => setExperiences(experiences.map((item, idx) => idx === i ? { ...item, description: value } : item))} placeholder="Principais responsabilidades e realizacoes..." />
          </div>
        ))}
      </EditableSection>

      <TagEditor
        title={`Skills (${skills.length})`}
        value={newSkill}
        setValue={setNewSkill}
        placeholder="Ex: React, Python, Excel..."
        items={skills}
        addItem={() => addListItem(newSkill, setNewSkill, skills, setSkills)}
        removeItem={(i) => setSkills(skills.filter((_, idx) => idx !== i))}
      />

      <EditableSection title={`Formacao (${education.length})`} onAdd={() => setEducation([...education, { ...emptyEducation }])}>
        {education.map((edu, i) => (
          <div key={i} className="mb-3 p-3 rounded-lg border border-border/60 bg-card relative">
            <RemoveButton onClick={() => setEducation(education.filter((_, idx) => idx !== i))} />
            <SmallInput value={edu.degree} onChange={(value) => setEducation(education.map((item, idx) => idx === i ? { ...item, degree: value } : item))} placeholder="Curso ou grau" className="mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <SmallInput value={edu.institution} onChange={(value) => setEducation(education.map((item, idx) => idx === i ? { ...item, institution: value } : item))} placeholder="Instituicao" />
              <SmallInput value={edu.period} onChange={(value) => setEducation(education.map((item, idx) => idx === i ? { ...item, period: value } : item))} placeholder="Periodo" />
            </div>
          </div>
        ))}
      </EditableSection>

      <EditableSection title={`Projetos (${projects.length})`} onAdd={() => setProjects([...projects, { ...emptyProject }])}>
        {projects.map((project, i) => (
          <div key={i} className="mb-3 p-3 rounded-lg border border-border/60 bg-card relative">
            <RemoveButton onClick={() => setProjects(projects.filter((_, idx) => idx !== i))} />
            <SmallInput value={project.name} onChange={(value) => setProjects(projects.map((item, idx) => idx === i ? { ...item, name: value } : item))} placeholder="Nome do projeto" className="mb-2" />
            <SmallTextarea value={project.description} onChange={(value) => setProjects(projects.map((item, idx) => idx === i ? { ...item, description: value } : item))} placeholder="Descricao do projeto..." />
            <SmallInput value={project.url} onChange={(value) => setProjects(projects.map((item, idx) => idx === i ? { ...item, url: value } : item))} placeholder="URL" className="mt-2" />
          </div>
        ))}
      </EditableSection>

      <TagEditor
        title={`Certificacoes (${certifications.length})`}
        value={newCertification}
        setValue={setNewCertification}
        placeholder="Ex: AWS Certified Cloud Practitioner"
        items={certifications}
        addItem={() => addListItem(newCertification, setNewCertification, certifications, setCertifications)}
        removeItem={(i) => setCertifications(certifications.filter((_, idx) => idx !== i))}
      />

      <TagEditor
        title={`Idiomas (${languages.length})`}
        value={newLanguage}
        setValue={setNewLanguage}
        placeholder="Ex: Ingles avancado"
        items={languages}
        addItem={() => addListItem(newLanguage, setNewLanguage, languages, setLanguages)}
        removeItem={(i) => setLanguages(languages.filter((_, idx) => idx !== i))}
      />
    </>
  );
}

function EditableSection({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) {
  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</span>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-primary">
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>
      {children}
    </div>
  );
}

function TagEditor({
  title,
  value,
  setValue,
  placeholder,
  items,
  addItem,
  removeItem,
}: {
  title: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  items: string[];
  addItem: () => void;
  removeItem: (index: number) => void;
}) {
  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex gap-2 mb-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder={placeholder}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={addItem} className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg">
          Adicionar
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
            {item}
            <button onClick={() => removeItem(i)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function SmallInput({ value, onChange, placeholder, className = "" }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
    />
  );
}

function SmallTextarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
    />
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
      <X className="w-3.5 h-3.5" />
    </button>
  );
}
