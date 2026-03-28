import { z } from "zod";

/**
 * Schema for the nested knowledge object returned by Supabase
 * when selecting card with knowledge (e.g. knowledge!inner or knowledge(...)).
 */
export const KnowledgeSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
    pos: z.string().nullable().optional(),
    level: z.string().nullable().optional(),
    self_examine_prompt: z.string().nullable().optional(),
    theme: z.string().nullable().optional(),
    example_sentence: z.string().nullable().optional(),
    image_name: z.string().nullable().optional(),
  })
  .transform((k) => ({
    code: k.code,
    name: k.name,
    description: k.description,
    pos: k.pos ?? "",
    level: k.level ?? "",
    selfExaminePrompt: k.self_examine_prompt ?? "",
    theme: k.theme ?? "",
    exampleSentence: k.example_sentence ?? "",
    imageName: k.image_name ?? null,
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
