import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest } from "next/server";
import { createAccountService } from "@/lib/services/factory";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== "operator") {
      throw ApiError.forbidden("权限不足");
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);

    const accountService = createAccountService();
    const result = await accountService.listUsers(page, perPage);

    return apiSuccess({
      accounts: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
