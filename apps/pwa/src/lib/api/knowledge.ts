// API functions for knowledge
import { t } from "@/lib/i18n";
import { parseApiErrorResponse } from "@/lib/utils/apiError";

export interface Knowledge {
  code: string;
  name: string;
  description: string;
  exampleSentence: string;
  imageName: string | null;
  created_at: string;
  updated_at: string;
  pos: string;
  level: string;
  selfExaminePrompt: string;
  theme: string;
  /** Operator list: 1 when needs_correction, else 0（兼容旧列展示） */
  pending_error_report_count?: number;
}

export interface PaginatedKnowledgeResult {
  data: Knowledge[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FetchKnowledgesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  level?: string;
  /** Only rows with at least one unresolved error report */
  pendingReportsOnly?: boolean;
}

export async function fetchKnowledges(params: FetchKnowledgesParams = {}): Promise<PaginatedKnowledgeResult> {
  const { page = 1, pageSize = 10, search, level, pendingReportsOnly } = params;
  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (search?.trim()) searchParams.set("search", search.trim());
  if (level?.trim()) searchParams.set("level", level.trim());
  if (pendingReportsOnly) searchParams.set("pendingReportsOnly", "true");

  const res = await fetch(`/api/knowledge?${searchParams.toString()}`);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(t().auth.forbidden);
    }
    const message = await parseApiErrorResponse(res, "Failed to load knowledge");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data || { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function updateKnowledge(
  code: string,
  data: {
    name?: string;
    description?: string;
    exampleSentence?: string;
    imageName?: string | null;
    pos?: string;
    level?: string;
    selfExaminePrompt?: string;
    theme?: string;
  }
): Promise<Knowledge> {
  const res = await fetch(`/api/knowledge/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "更新失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteKnowledge(code: string): Promise<{ code: string; name: string }> {
  const res = await fetch(`/api/knowledge/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "删除失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

