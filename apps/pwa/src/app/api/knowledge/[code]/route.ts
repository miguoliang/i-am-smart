import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { writeAuditLog } from "@/lib/utils/auditLog";

function mapKnowledgeDbRowToApi(row: Record<string, unknown>) {
  return {
    code: row.code as string,
    name: row.name as string,
    description: row.description as string,
    exampleSentence: (row.example_sentence as string) ?? "",
    imageName: (row.image_name as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    pos: (row.pos as string) ?? "",
    level: (row.level as string) ?? "",
    selfExaminePrompt: (row.self_examine_prompt as string) ?? "",
    theme: (row.theme as string) ?? "",
  };
}

/** PUT: Update a knowledge item */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { user } = await requireOperator(req);
    const { code } = await params;
    if (!code) throw ApiError.validationError("缺少 code");

    let body: {
      name?: string;
      description?: string;
      exampleSentence?: string;
      imageName?: string | null;
      pos?: string;
      level?: string;
      selfExaminePrompt?: string;
      theme?: string;
    };
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
    if (body.exampleSentence !== undefined) {
      if (typeof body.exampleSentence !== "string") {
        throw ApiError.validationError("exampleSentence 必须是字符串");
      }
      update.example_sentence = body.exampleSentence;
    }
    if (body.imageName !== undefined) {
      if (body.imageName !== null && typeof body.imageName !== "string") {
        throw ApiError.validationError("imageName 必须是字符串或 null");
      }
      update.image_name = body.imageName;
    }
    if (body.pos !== undefined) {
      if (typeof body.pos !== "string") throw ApiError.validationError("pos 必须是字符串");
      update.pos = body.pos;
    }
    if (body.level !== undefined) {
      if (typeof body.level !== "string") throw ApiError.validationError("level 必须是字符串");
      update.level = body.level;
    }
    if (body.selfExaminePrompt !== undefined) {
      if (typeof body.selfExaminePrompt !== "string") {
        throw ApiError.validationError("selfExaminePrompt 必须是字符串");
      }
      update.self_examine_prompt = body.selfExaminePrompt;
    }
    if (body.theme !== undefined) {
      if (typeof body.theme !== "string") throw ApiError.validationError("theme 必须是字符串");
      update.theme = body.theme;
    }

    if (Object.keys(update).length === 0) {
      throw ApiError.validationError("至少提供一个要更新的字段");
    }

    update.updated_at = new Date().toISOString();

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("knowledge")
      .update(update)
      .eq("code", code)
      .select()
      .single();

    if (error) throw ApiError.internal(error.message);
    if (!data) throw ApiError.notFound("知识条目不存在");

    const payload = mapKnowledgeDbRowToApi(data as Record<string, unknown>);

    void writeAuditLog({
      operator_id: user.id,
      action: "update_knowledge",
      target_type: "knowledge",
      target_id: code,
      detail: update,
    });

    return apiSuccess(payload);
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE: Remove a knowledge item (cascades account_cards, error reports) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { user } = await requireOperator(req);
    const { code } = await params;
    if (!code) throw ApiError.validationError("缺少 code");

    const admin = createSupabaseAdmin();
    const { data: row, error: selectError } = await admin
      .from("knowledge")
      .select("code, name")
      .eq("code", code)
      .maybeSingle();

    if (selectError) throw ApiError.internal(selectError.message);
    if (!row) throw ApiError.notFound("知识条目不存在");

    const { error: deleteError } = await admin.from("knowledge").delete().eq("code", code);

    if (deleteError) throw ApiError.internal(deleteError.message);

    void writeAuditLog({
      operator_id: user.id,
      action: "delete_knowledge",
      target_type: "knowledge",
      target_id: code,
      detail: { name: row.name },
    });

    return apiSuccess({ code: row.code, name: row.name });
  } catch (e) {
    return handleApiError(e);
  }
}
