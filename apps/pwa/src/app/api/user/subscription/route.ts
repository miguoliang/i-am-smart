import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { isValidPaidPlan } from "@/lib/payPlans";

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiSuccess({ isPro: false });
    }

    const { data, error } = await supabase
      .from("pay_orders")
      .select("plan_type, amount_total")
      .eq("account_id", user.id)
      .eq("status", "paid")
      .not("plan_type", "is", null);

    if (error) {
      return apiSuccess({ isPro: false });
    }

    return apiSuccess({
      isPro: (data ?? []).some((order) =>
        isValidPaidPlan(order.plan_type, order.amount_total)
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
