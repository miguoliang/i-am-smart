import { NextRequest } from "next/server";
import { createAccountService } from "@/lib/services/factory";
import { handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

export async function GET(req: NextRequest) {
  try {
    await requireOperator();

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
