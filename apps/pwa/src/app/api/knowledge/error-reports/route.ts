import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth, requireOperator } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

/** GET: operators list error reports (default: unresolved only) */
export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);
    const showAll = req.nextUrl.searchParams.get("resolved") === "all";

    const admin = createSupabaseAdmin();
    let q = admin
      .from("knowledge_error_reports")
      .select("id, knowledge_code, reporter_id, created_at, resolved_at")
      .order("created_at", { ascending: false });

    if (!showAll) {
      q = q.is("resolved_at", null);
    }

    const { data: reports, error } = await q;

    if (error) throw ApiError.internal(error.message);

    const rows = reports ?? [];
    const codes = [...new Set(rows.map((r) => r.knowledge_code))];
    const nameByCode = new Map<string, { name: string; description: string }>();

    if (codes.length > 0) {
      const { data: knowRows, error: kErr } = await admin
        .from("knowledge")
        .select("code, name, description")
        .in("code", codes);

      if (kErr) throw ApiError.internal(kErr.message);
      for (const k of knowRows ?? []) {
        nameByCode.set(k.code, { name: k.name, description: k.description });
      }
    }

    const mapped = rows.map((r) => {
      const k = nameByCode.get(r.knowledge_code);
      return {
        id: r.id,
        knowledge_code: r.knowledge_code,
        reporter_id: r.reporter_id,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        knowledge_name: k?.name ?? "",
        knowledge_description: k?.description ?? "",
      };
    });

    return apiSuccess(mapped);
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST: authenticated learner flags current knowledge entry */
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
      .select("code")
      .eq("code", code)
      .maybeSingle();

    if (kErr) throw ApiError.internal(kErr.message);
    if (!knowledgeRow) throw ApiError.validationError("词条不存在");

    const { data: existing } = await admin
      .from("knowledge_error_reports")
      .select("id")
      .eq("knowledge_code", code)
      .is("resolved_at", null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return apiSuccess({
        alreadyReported: true,
        message: "该词条已在待处理列表中，感谢反馈",
      });
    }

    const { error: insErr } = await admin.from("knowledge_error_reports").insert({
      knowledge_code: code,
      reporter_id: user.id,
    });

    if (insErr) throw ApiError.internal(insErr.message);

    logger.info("Knowledge error reported", { userId: user.id, knowledgeCode: code });

    return apiSuccess({
      alreadyReported: false,
      message: "已标记该词条有问题，我们会尽快处理",
    });
  } catch (e) {
    return handleApiError(e);
  }
}
