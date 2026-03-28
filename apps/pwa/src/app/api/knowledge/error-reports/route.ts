import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth, requireOperator } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

/** GET: operators list knowledge entries flagged for correction */
export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const admin = createSupabaseAdmin();
    const { data: rows, error } = await admin
      .from("knowledge")
      .select("code, name, description, created_at, updated_at")
      .eq("needs_correction", true)
      .order("updated_at", { ascending: false });

    if (error) throw ApiError.internal(error.message);

    const mapped = (rows ?? []).map((r) => ({
      knowledge_code: r.code,
      knowledge_name: r.name,
      knowledge_description: r.description,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return apiSuccess(mapped);
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST: authenticated learner flags current knowledge entry for correction */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);

    let body: { knowledgeCode?: string };
    try {
      body = await req.json();
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }

    const code = typeof body.knowledgeCode === "string" ? body.knowledgeCode.trim() : "";
    if (!code) throw ApiError.validationError("缺少 knowledgeCode");

    const admin = createSupabaseAdmin();

    const { data: knowledgeRow, error: kErr } = await admin
      .from("knowledge")
      .select("code, needs_correction")
      .eq("code", code)
      .maybeSingle();

    if (kErr) throw ApiError.internal(kErr.message);
    if (!knowledgeRow) throw ApiError.validationError("词条不存在");

    if (knowledgeRow.needs_correction) {
      return apiSuccess({
        alreadyReported: true,
        message: "该词条已在待处理列表中，感谢反馈",
      });
    }

    const { error: updErr } = await admin
      .from("knowledge")
      .update({ needs_correction: true })
      .eq("code", code);

    if (updErr) throw ApiError.internal(updErr.message);

    logger.info("Knowledge flagged for correction", { userId: user.id, knowledgeCode: code });

    return apiSuccess({
      alreadyReported: false,
      message: "已标记该词条有问题，我们会尽快处理",
    });
  } catch (e) {
    return handleApiError(e);
  }
}
