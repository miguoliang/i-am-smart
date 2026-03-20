import { parseApiErrorResponse } from "@/lib/utils/apiError";

export interface KnowledgeErrorReportRow {
  id: number;
  knowledge_code: string;
  reporter_id: string;
  created_at: string;
  resolved_at: string | null;
  knowledge_name: string;
  knowledge_description: string;
}

export async function submitKnowledgeErrorReport(knowledgeCode: string): Promise<{
  alreadyReported?: boolean;
  message?: string;
}> {
  const res = await fetch("/api/knowledge/error-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knowledgeCode }),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "提交失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data ?? {};
}

export async function fetchKnowledgeErrorReports(params?: {
  unresolvedOnly?: boolean;
}): Promise<KnowledgeErrorReportRow[]> {
  const q = new URLSearchParams();
  if (params?.unresolvedOnly === false) q.set("resolved", "all");
  const res = await fetch(`/api/knowledge/error-reports?${q.toString()}`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "加载失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function resolveKnowledgeErrorReport(id: number): Promise<void> {
  const res = await fetch(`/api/knowledge/error-reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolved: true }),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "操作失败");
    throw new Error(message);
  }
}
