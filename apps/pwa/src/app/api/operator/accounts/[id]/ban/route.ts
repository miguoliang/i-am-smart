import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { writeAuditLog } from "@/lib/utils/auditLog";

interface BanBody {
  banned: boolean;
}

/** POST: Ban or unban user (operator only) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireOperator(req);
    const { id } = await params;
    if (!id) {
      throw ApiError.validationError("缺少用户 ID");
    }

    let body: BanBody;
    try {
      body = (await req.json()) as BanBody;
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }

    if (typeof body.banned !== "boolean") {
      throw ApiError.validationError("body.banned 必须为 boolean");
    }

    const admin = createSupabaseAdmin();
    const banDuration = body.banned ? "876000h" : "none";

    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: banDuration,
    });

    if (error) {
      throw ApiError.internal(error.message);
    }

    void writeAuditLog({
      operator_id: user.id,
      action: body.banned ? "ban_user" : "unban_user",
      target_type: "user",
      target_id: id,
    });

    return apiSuccess({ banned: body.banned });
  } catch (e) {
    return handleApiError(e);
  }
}
