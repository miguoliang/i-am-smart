import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

/** PUT: Update a knowledge item */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireOperator(req);
    const { code } = await params;
    if (!code) throw ApiError.validationError("缺少 code");

    let body: { name?: string; description?: string; metadata?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        throw ApiError.validationError("name 不能为空");
      }
      update.name = body.name.trim();
    }
    if (body.description !== undefined) {
      update.description = body.description;
    }
    if (body.metadata !== undefined) {
      update.metadata = body.metadata;
    }

    if (Object.keys(update).length === 0) {
      throw ApiError.validationError("至少提供一个要更新的字段");
    }

    update.updated_at = new Date().toISOString();

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("knowledges")
      .update(update)
      .eq("code", code)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound("知识条目不存在");

    return apiSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE: Delete a knowledge item */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireOperator(req);
    const { code } = await params;
    if (!code) throw ApiError.validationError("缺少 code");

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("knowledges")
      .delete()
      .eq("code", code);

    if (error) throw ApiError.internal(error.message);

    return apiSuccess({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
