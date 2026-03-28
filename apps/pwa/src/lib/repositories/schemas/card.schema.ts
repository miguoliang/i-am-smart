import { z } from "zod";

/**
 * Schema for knowledge metadata (arbitrary key-value from DB).
 * Used when parsing Supabase card/knowledge responses.
 */
export const KnowledgeMetadataSchema = z.record(z.string(), z.unknown());

/**
 * Schema for the nested knowledge object returned by Supabase
 * when selecting card with knowledge (e.g. knowledge!inner or knowledge(...)).
 */
export const KnowledgeSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
    metadata: KnowledgeMetadataSchema.default({}),
    pos: z.string().nullable().optional(),
    level: z.string().nullable().optional(),
    self_examine_prompt: z.string().nullable().optional(),
    theme: z.string().nullable().optional(),
  })
  .transform((k) => ({
    code: k.code,
    name: k.name,
    description: k.description,
    metadata: k.metadata,
    pos: k.pos ?? "",
    level: k.level ?? "",
    selfExaminePrompt: k.self_examine_prompt ?? "",
    theme: k.theme ?? "",
  }));

/**
 * Schema for a single card row as returned by Supabase
 * (get_due_cards RPC or account_cards select with knowledge).
 */
export const CardRowSchema = z.object({
  id: z.number(),
  knowledge_code: z.string(),
  knowledge: KnowledgeSchema,
  next_review_date: z.string(),
  last_reviewed_at: z.string().nullish(),
  ease_factor: z.number().optional(),
  interval_days: z.number().optional(),
  repetitions: z.number().optional(),
});

export type CardRow = z.infer<typeof CardRowSchema>;
