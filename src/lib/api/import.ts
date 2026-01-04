// API functions for import
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
  } else {
    const errorMessage = result.error?.message || result.error || "导入失败";
    throw new Error(errorMessage);
  }
}

