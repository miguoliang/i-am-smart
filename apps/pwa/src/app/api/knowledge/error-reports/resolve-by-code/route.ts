import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { writeAuditLog } from "@/lib/utils/auditLog";

/** POST: resolve all unresolved error reports for one knowledge code (after operator edits the entry). */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireOperator(req);

    let body: { knowledgeCode?: string };
    try {
      body = await req.json();
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }

    const code =
      typeof body.knowledgeCode === "string" ? body.knowledgeCode.trim() : "";
    if (!code) throw ApiError.validationError("缺少 knowledgeCode");

    const admin = createSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: updated, error } = await admin
      .from("knowledge_error_reports")
      .update({ resolved_at: now })
      .eq("knowledge_code", code)
      .is("resolved_at", null)
      .select("id");

    if (error) throw ApiError.internal(error.message);

    const resolvedCount = updated?.length ?? 0;

    if (resolvedCount > 0) {
      void writeAuditLog({
        operator_id: user.id,
        action: "resolve_knowledge_error_report",
        target_type: "knowledge",
        target_id: code,
        detail: { knowledge_code: code, resolved_count: resolvedCount },
      });
    }

    return apiSuccess({ resolvedCount });
  } catch (e) {
    return handleApiError(e);
  }
}
