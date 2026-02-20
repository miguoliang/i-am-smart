// API functions for import
import type { ApiResponse } from "@/lib/utils/apiError";

export interface ImportResult {
  success: boolean;
  count?: number;
  error?: string;
}

export interface CefrKnowledgeItem {
  englishWord: string;
  pos: string;
  level: string;
  chineseTranslation: string;
  exampleSentence: string;
  selfExaminePrompt: string;
  theme: string;
  imageName: string | null;
}

export async function importKnowledge(items: CefrKnowledgeItem[]): Promise<ImportResult> {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(items),
  });

  const result = await res.json();

  if (res.ok) {
    // API returns { data: { success, count, total, skipped, message } }
    const data = result.data;
    return { success: true, count: data?.count };
  }
  const body = result as ApiResponse | null;
  const message =
    (typeof body?.error === "object" && body?.error?.message) || "Failed to import knowledge";
  throw new Error(message);
}

