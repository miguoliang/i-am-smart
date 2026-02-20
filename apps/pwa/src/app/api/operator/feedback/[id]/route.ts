import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

const VALID_STATUSES = ["pending", "resolved"];

/** PATCH: Update feedback status and/or operator note */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOperator(req);
    const { id } = await params;
    if (!id) {
      throw ApiError.validationError("缺少反馈 ID");
    }

    let body: { status?: string; operator_note?: string };
    try {
      body = await req.json();
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }

    const update: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        throw ApiError.validationError("status 必须为 pending 或 resolved");
      }
      update.status = body.status;
    }

    if (body.operator_note !== undefined) {
      if (typeof body.operator_note !== "string" || body.operator_note.length > 2000) {
        throw ApiError.validationError("operator_note 必须为字符串且不超过 2000 字");
      }
      update.operator_note = body.operator_note;
    }

    if (Object.keys(update).length === 0) {
      throw ApiError.validationError("至少提供 status 或 operator_note");
    }

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("feedback")
      .update(update)
      .eq("id", id)
      .select("id, status, operator_note")
      .single();

    if (error) {
      throw ApiError.internal(error.message);
    }
    if (!data) {
      throw ApiError.notFound("反馈不存在");
    }

    return apiSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}
