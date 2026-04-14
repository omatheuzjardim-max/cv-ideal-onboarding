import { Router } from "express";
import { db } from "@workspace/db";
import { resumeSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateSessionBody,
  UpdateSessionBody,
} from "@workspace/api-zod";
import multer from "multer";
import mammoth from "mammoth";
import puppeteer from "puppeteer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

const placeholderValues = new Set([
  "cargo",
  "empresa",
  "período",
  "periodo",
  "descrição",
  "descricao",
  "curso",
  "instituição",
  "instituicao",
]);

function cleanImportedText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (placeholderValues.has(normalized.toLowerCase())) return undefined;
  return normalized;
}

function cleanImportedProfile(profile: Record<string, unknown>) {
  const experiences = Array.isArray(profile.experiences)
    ? profile.experiences
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          title: cleanImportedText(item.title),
          company: cleanImportedText(item.company),
          period: cleanImportedText(item.period),
          description: cleanImportedText(item.description),
        }))
        .filter((item) => item.title || item.company || item.description)
    : [];

  const education = Array.isArray(profile.education)
    ? profile.education
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          degree: cleanImportedText(item.degree),
          institution: cleanImportedText(item.institution),
          period: cleanImportedText(item.period),
        }))
        .filter((item) => item.degree || item.institution)
    : [];

  const projects = Array.isArray(profile.projects)
    ? profile.projects
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          name: cleanImportedText(item.name),
          description: cleanImportedText(item.description),
          url: cleanImportedText(item.url),
        }))
        .filter((item) => item.name || item.description || item.url)
    : [];

  const stringList = (value: unknown) =>
    Array.isArray(value)
      ? value.map(cleanImportedText).filter((item): item is string => Boolean(item))
      : [];

  return {
    fullName: cleanImportedText(profile.fullName) ?? null,
    currentRole: cleanImportedText(profile.currentRole) ?? null,
    email: cleanImportedText(profile.email) ?? null,
    phone: cleanImportedText(profile.phone) ?? null,
    location: cleanImportedText(profile.location) ?? null,
    portfolioUrl: cleanImportedText(profile.portfolioUrl) ?? null,
    summary: cleanImportedText(profile.summary) ?? null,
    experiences,
    skills: stringList(profile.skills),
    education,
    certifications: stringList(profile.certifications),
    languages: stringList(profile.languages),
    projects,
  };
}

function hasUsefulImportedProfile(profile: ReturnType<typeof cleanImportedProfile>) {
  return Boolean(
    profile.fullName ||
      profile.email ||
      profile.phone ||
      profile.summary ||
      profile.experiences.length > 0 ||
      profile.skills.length > 0 ||
      profile.education.length > 0,
  );
}

function toSessionResponse(session: Record<string, unknown>) {
  return session;
}

router.post("/sessions", async (req, res) => {
  try {
    const body = CreateSessionBody.parse(req.body);
    const [session] = await db
      .insert(resumeSessionsTable)
      .values({
        careerGoal: body.careerGoal ?? undefined,
        applicationVolume: body.applicationVolume ?? undefined,
        status: "onboarding",
      })
      .returning();
    res.status(201).json(toSessionResponse(session));
  } catch (err) {
    req.log.error({ err }, "Error creating session");
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(resumeSessionsTable)
      .where(eq(resumeSessionsTable.id, req.params.sessionId));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(toSessionResponse(session));
  } catch (err) {
    req.log.error({ err }, "Error fetching session");
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

router.put("/sessions/:sessionId", async (req, res) => {
  try {
    const body = UpdateSessionBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.careerGoal !== undefined) updateData.careerGoal = body.careerGoal;
    if (body.applicationVolume !== undefined) updateData.applicationVolume = body.applicationVolume;
    if (body.interviewRate !== undefined) updateData.interviewRate = body.interviewRate;
    if (body.templateChoice !== undefined) updateData.templateChoice = body.templateChoice;
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.portfolioUrl !== undefined) updateData.portfolioUrl = body.portfolioUrl;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.profileSourceType !== undefined) updateData.profileSourceType = body.profileSourceType;
    if (body.structuredProfileJson !== undefined) updateData.structuredProfileJson = body.structuredProfileJson;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.jobDescription !== undefined) updateData.jobDescription = body.jobDescription;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(resumeSessionsTable)
      .set(updateData)
      .where(eq(resumeSessionsTable.id, req.params.sessionId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(toSessionResponse(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating session");
    res.status(500).json({ error: "Failed to update session" });
  }
});

router.post("/sessions/:sessionId/import-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "Nenhum arquivo enviado." });
      return;
    }

    const { mimetype, buffer, originalname } = req.file;
    let extractedText = "";

    if (mimetype === "application/pdf") {
      const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js") as unknown as {
        default?: (input: Buffer) => Promise<{ text: string }>;
      } & ((input: Buffer) => Promise<{ text: string }>);
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimetype.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimetype};base64,${base64}` },
              },
              {
                type: "text",
                text: "Transcreva todo o texto visível neste currículo exatamente como aparece, incluindo nome, cargo, empresa, período, descrições, skills e formação.",
              },
            ],
          },
        ],
      });
      extractedText = completion.choices[0]?.message?.content ?? "";
    } else {
      res.status(400).json({ success: false, error: "Formato não suportado. Envie PDF, DOCX ou imagem." });
      return;
    }

    if (!extractedText || extractedText.trim().length < 30) {
      res.status(422).json({ success: false, error: "Não foi possível ler o conteúdo do arquivo. Tente outro formato." });
      return;
    }

    const prompt = `Voce e um extrator especializado de curriculos. Analise o texto abaixo de um curriculo e extraia as informacoes estruturadas.

Extraia APENAS o que esta explicitamente no texto. Nao invente nada. Se um campo nao estiver no texto, use null ou array vazio.
Nao use valores de exemplo. Nao preencha cargo, empresa, curso, periodo, descricao, skills ou resumo se essas informacoes nao estiverem escritas no texto do curriculo.

Texto do curriculo:
---
${extractedText.slice(0, 8000)}
---

Retorne APENAS um JSON valido, sem explicacoes e sem markdown:
{
  "fullName": null,
  "currentRole": null,
  "email": null,
  "phone": null,
  "location": null,
  "portfolioUrl": null,
  "summary": null,
  "experiences": [],
  "skills": [],
  "education": [],
  "certifications": [],
  "languages": [],
  "projects": []
}

Formato dos itens, quando existirem:
- experiences: objetos com title, company, period, description
- education: objetos com degree, institution, period
- projects: objetos com name, description, url`;
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "Você é um extrator preciso de dados de currículos. Extrai apenas o que está explicitamente no texto. Nunca inventa informações.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let profile: Record<string, unknown> | null = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      profile = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      profile = null;
    }

    if (profile) {
      profile = cleanImportedProfile(profile);
    }

    if (profile && !hasUsefulImportedProfile(profile as ReturnType<typeof cleanImportedProfile>)) {
      res.status(422).json({
        success: false,
        error: "O arquivo foi lido, mas nao encontramos dados profissionais suficientes para preencher automaticamente. Use outro arquivo ou preencha manualmente.",
      });
      return;
    }

    if (profile) {
      await db
        .update(resumeSessionsTable)
        .set({
          structuredProfileJson: profile,
          rawProfileText: extractedText,
          profileSourceType: "pdf",
          fullName: (profile.fullName as string) || undefined,
          email: (profile.email as string) || undefined,
          phone: (profile.phone as string) || undefined,
          location: (profile.location as string) || undefined,
          summary: (profile.summary as string) || undefined,
          updatedAt: new Date(),
        })
        .where(eq(resumeSessionsTable.id, req.params.sessionId));
    }

    req.log.info({ sessionId: req.params.sessionId, filename: originalname }, "File imported successfully");
    res.json({ success: !!profile, profile: profile || null });
  } catch (err) {
    req.log.error({ err }, "Error importing file");
    res.status(500).json({ success: false, error: "Erro ao processar o arquivo. Tente outro formato." });
  }
});

router.post("/sessions/:sessionId/generate", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(resumeSessionsTable)
      .where(eq(resumeSessionsTable.id, req.params.sessionId));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await db
      .update(resumeSessionsTable)
      .set({ generationStatus: "generating", updatedAt: new Date() })
      .where(eq(resumeSessionsTable.id, req.params.sessionId));

    res.json({ generationStatus: "generating" });

    generateResumeInBackground(session.id).catch((err) => {
      console.error("Background generation failed:", err);
    });
  } catch (err) {
    req.log.error({ err }, "Error starting generation");
    res.status(500).json({ error: "Failed to start generation" });
  }
});

async function generateResumeInBackground(sessionId: string) {
  const [session] = await db
    .select()
    .from(resumeSessionsTable)
    .where(eq(resumeSessionsTable.id, sessionId));

  if (!session) return;

  const profileJson = session.structuredProfileJson as Record<string, unknown> | null;
  const profileText = profileJson
    ? JSON.stringify(profileJson)
    : `Nome: ${session.fullName || "Não informado"}\nEmail: ${session.email || ""}\nResumo: ${session.summary || ""}`;

  const prompt = `Você é um especialista em currículos e otimização ATS (Applicant Tracking Systems). 

Perfil do candidato:
${profileText}

Descrição da vaga:
${session.jobDescription || "Não informada"}

Cargo alvo: ${session.jobTitle || ""}
Empresa: ${session.company || ""}

Sua tarefa é:
1. Analisar a aderência do perfil à vaga
2. Calcular um score ATS estimado de 0 a 100
3. Gerar uma versão otimizada do currículo em formato JSON

Retorne APENAS um JSON com esta estrutura:
{
  "atsScore": 72,
  "jobAnalysis": {
    "keywordsFound": ["gestão de projetos", "liderança", "Python"],
    "keywordsMissing": ["Scrum", "Agile", "AWS"],
    "matchPercentage": 72,
    "mainImprovements": [
      "Destacou experiência com gestão de equipes",
      "Adicionou palavras-chave técnicas da vaga",
      "Reorganizou experiências em ordem de relevância"
    ]
  },
  "optimizedResume": {
    "fullName": "${session.fullName || "Nome do Candidato"}",
    "currentRole": "",
    "email": "${session.email || ""}",
    "phone": "${session.phone || ""}",
    "location": "${session.location || ""}",
    "portfolioUrl": "${session.portfolioUrl || ""}",
    "summary": "Resumo profissional otimizado para a vaga...",
    "experiences": [],
    "skills": [],
    "education": [],
    "certifications": [],
    "languages": [],
    "projects": []
  }
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      result = {};
    }

    const atsScore = (result.atsScore as number) || 65;
    const jobAnalysis = result.jobAnalysis || {};
    const optimizedResume = result.optimizedResume || {};

    await db
      .update(resumeSessionsTable)
      .set({
        generationStatus: "done",
        atsScore,
        jobAnalysisJson: jobAnalysis,
        previewResumeJson: optimizedResume,
        finalResumeJson: optimizedResume,
        status: "preview",
        updatedAt: new Date(),
      })
      .where(eq(resumeSessionsTable.id, sessionId));
  } catch (err) {
    await db
      .update(resumeSessionsTable)
      .set({ generationStatus: "error", updatedAt: new Date() })
      .where(eq(resumeSessionsTable.id, sessionId));
    throw err;
  }
}

router.get("/sessions/:sessionId/generation-status", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(resumeSessionsTable)
      .where(eq(resumeSessionsTable.id, req.params.sessionId));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({
      generationStatus: session.generationStatus || "pending",
      atsScore: session.atsScore,
      previewResumeJson: session.previewResumeJson,
      jobAnalysisJson: session.jobAnalysisJson,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching generation status");
    res.status(500).json({ error: "Failed to fetch generation status" });
  }
});

router.get("/sessions/:sessionId/download-pdf", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(resumeSessionsTable)
      .where(eq(resumeSessionsTable.id, req.params.sessionId));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.paymentStatus !== "paid") {
      res.status(402).json({ error: "Payment required" });
      return;
    }

    const resumeData = session.finalResumeJson as Record<string, unknown> | null;
    const template = session.templateChoice || "moderno";

    const html = generateResumeHtml(resumeData, template);
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "16mm",
          right: "14mm",
          bottom: "16mm",
          left: "14mm",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="curriculo-otimizado.pdf"`);
      res.send(Buffer.from(pdf));
    } finally {
      await browser.close();
    }
  } catch (err) {
    req.log.error({ err }, "Error downloading PDF");
    res.status(500).json({ error: "Failed to download" });
  }
});

function generateResumeHtml(data: Record<string, unknown> | null, template: string): string {
  if (!data) return "<html><body><p>Currículo não disponível</p></body></html>";

  const isModern = template !== "classico";
  const primaryColor = isModern ? "#2563eb" : "#1e3a5f";
  const accentColor = isModern ? "#3b82f6" : "#2c5282";

  const experiences = (data.experiences as Array<Record<string, string>>) || [];
  const skills = (data.skills as string[]) || [];
  const education = (data.education as Array<Record<string, string>>) || [];
  const certifications = (data.certifications as string[]) || [];
  const languages = (data.languages as string[]) || [];
  const projects = (data.projects as Array<Record<string, string>>) || [];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Currículo - ${data.fullName || ""}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ${isModern ? "'Arial', sans-serif" : "'Georgia', serif"}; color: #1a1a1a; background: white; font-size: 11pt; line-height: 1.5; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 24px; }
  h1 { font-size: 26pt; color: ${primaryColor}; font-weight: bold; }
  .role { font-size: 14pt; color: #555; margin-top: 4px; }
  .contact { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; font-size: 10pt; color: #666; }
  .section { margin-bottom: 24px; }
  h2 { font-size: 13pt; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid ${accentColor}; padding-bottom: 4px; margin-bottom: 12px; }
  .exp-item { margin-bottom: 16px; }
  .exp-title { font-weight: bold; font-size: 11pt; }
  .exp-company { color: ${primaryColor}; font-size: 10.5pt; }
  .exp-period { color: #888; font-size: 10pt; }
  .exp-desc { margin-top: 4px; font-size: 10pt; color: #444; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { background: ${isModern ? "#eff6ff" : "#f0f4f8"}; color: ${primaryColor}; padding: 4px 12px; border-radius: ${isModern ? "999px" : "4px"}; font-size: 10pt; border: 1px solid ${isModern ? "#bfdbfe" : "#cbd5e0"}; }
  .summary { font-size: 11pt; color: #444; line-height: 1.7; }
  @media print { body { margin: 0; } .page { padding: 20px; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <h1>${data.fullName || "Nome do Candidato"}</h1>
    <div class="role">${data.currentRole || ""}</div>
    <div class="contact">
      ${data.email ? `<span>✉ ${data.email}</span>` : ""}
      ${data.phone ? `<span>📞 ${data.phone}</span>` : ""}
      ${data.location ? `<span>📍 ${data.location}</span>` : ""}
      ${data.portfolioUrl ? `<span>🌐 ${data.portfolioUrl}</span>` : ""}
    </div>
  </header>

  ${data.summary ? `<div class="section"><h2>Resumo Profissional</h2><p class="summary">${data.summary}</p></div>` : ""}

  ${experiences.length > 0 ? `<div class="section"><h2>Experiência Profissional</h2>${experiences.map(exp => `
    <div class="exp-item">
      <div class="exp-title">${exp.title || ""}</div>
      <div class="exp-company">${exp.company || ""}</div>
      <div class="exp-period">${exp.period || ""}</div>
      <div class="exp-desc">${exp.description || ""}</div>
    </div>`).join("")}</div>` : ""}

  ${skills.length > 0 ? `<div class="section"><h2>Competências</h2><div class="skills-grid">${skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div></div>` : ""}

  ${education.length > 0 ? `<div class="section"><h2>Formação Acadêmica</h2>${education.map(edu => `
    <div class="exp-item">
      <div class="exp-title">${edu.degree || ""}</div>
      <div class="exp-company">${edu.institution || ""}</div>
      <div class="exp-period">${edu.period || ""}</div>
    </div>`).join("")}</div>` : ""}

  ${certifications.length > 0 ? `<div class="section"><h2>Certificações</h2><ul>${certifications.map(c => `<li>${c}</li>`).join("")}</ul></div>` : ""}

  ${languages.length > 0 ? `<div class="section"><h2>Idiomas</h2><p>${languages.join(" • ")}</p></div>` : ""}

  ${projects.length > 0 ? `<div class="section"><h2>Projetos</h2>${projects.map(p => `
    <div class="exp-item">
      <div class="exp-title">${p.name || ""}</div>
      <div class="exp-desc">${p.description || ""}</div>
      ${p.url ? `<div class="exp-period">${p.url}</div>` : ""}
    </div>`).join("")}</div>` : ""}
</div>
</body>
</html>`;
}

export { generateResumeHtml };
export default router;
