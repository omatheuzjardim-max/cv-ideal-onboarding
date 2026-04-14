import { pgTable, text, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumeSessionsTable = pgTable("resume_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull().default("onboarding"),
  careerGoal: text("career_goal"),
  applicationVolume: text("application_volume"),
  interviewRate: text("interview_rate"),
  templateChoice: text("template_choice"),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  summary: text("summary"),
  rawProfileText: text("raw_profile_text"),
  profileSourceType: text("profile_source_type"),
  structuredProfileJson: jsonb("structured_profile_json"),
  jobTitle: text("job_title"),
  company: text("company"),
  jobDescription: text("job_description"),
  jobAnalysisJson: jsonb("job_analysis_json"),
  atsScore: integer("ats_score"),
  previewResumeJson: jsonb("preview_resume_json"),
  finalResumeJson: jsonb("final_resume_json"),
  generationStatus: text("generation_status").default("pending"),
  paymentStatus: text("payment_status").default("unpaid"),
  priceCents: integer("price_cents").default(1990),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResumeSessionSchema = createInsertSchema(resumeSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertResumeSession = z.infer<typeof insertResumeSessionSchema>;
export type ResumeSession = typeof resumeSessionsTable.$inferSelect;
