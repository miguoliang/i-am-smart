import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { writeAuditLog } from "@/lib/utils/auditLog";

/** PATCH: operator marks a report as resolved (after fixing the entry in 单词列表) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireOperator(req);
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id) || id < 1) throw ApiError.validationError("无效的 id");

    let body: { resolved?: boolean };
    try {
      body = await req.json();
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }
    if (body.resolved !== true) {
      throw ApiError.validationError("仅支持 resolved: true");
    }

    const admin = createSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("knowledge_error_reports")
      .update({ resolved_at: now })
      .eq("id", id)
      .is("resolved_at", null)
      .select("id, knowledge_code")
      .maybeSingle();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound("记录不存在或已处理");

    void writeAuditLog({
      operator_id: user.id,
      action: "resolve_knowledge_error_report",
      target_type: "knowledge_error_report",
      target_id: String(id),
      detail: { knowledge_code: data.knowledge_code },
    });

    return apiSuccess({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
