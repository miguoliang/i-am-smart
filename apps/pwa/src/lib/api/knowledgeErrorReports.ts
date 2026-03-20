import { parseApiErrorResponse } from "@/lib/utils/apiError";

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

export async function resolveKnowledgeErrorReportsByCode(
  knowledgeCode: string
): Promise<{ resolvedCount: number }> {
  const res = await fetch("/api/knowledge/error-reports/resolve-by-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knowledgeCode }),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "操作失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data ?? { resolvedCount: 0 };
}
