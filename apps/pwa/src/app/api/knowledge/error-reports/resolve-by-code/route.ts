import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  apiSuccess,
  handleApiError,
  ApiError,
  PUBLIC_INTERNAL_ERROR_MESSAGE,
} from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { writeAuditLog } from "@/lib/utils/auditLog";

/** POST: clear correction flag after operator edits the entry */
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
    const { data: updated, error } = await admin
      .from("knowledge")
      .update({ needs_correction: false })
      .eq("code", code)
      .eq("needs_correction", true)
      .select("code");

    if (error) {
      logger.error("Resolve knowledge error report failed", { message: error.message, code });
      throw ApiError.internal(PUBLIC_INTERNAL_ERROR_MESSAGE);
    }

    const resolvedCount = updated?.length ?? 0;

    if (resolvedCount > 0) {
      void writeAuditLog({
        operator_id: user.id,
        action: "resolve_knowledge_error_report",
        target_type: "knowledge",
        target_id: code,
        detail: { knowledge_code: code },
      });
    }

    return apiSuccess({ resolvedCount });
  } catch (e) {
    return handleApiError(e);
  }
}
