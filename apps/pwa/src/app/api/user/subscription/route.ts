import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { handleApiError, apiSuccess } from "@/lib/utils/apiError";

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiSuccess({ isPro: false });
    }

    const { data, error } = await supabase
      .from("pay_orders")
      .select("id")
      .eq("account_id", user.id)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();

    if (error) {
      return apiSuccess({ isPro: false });
    }

    return apiSuccess({ isPro: !!data });
  } catch (error) {
    return handleApiError(error);
  }
}
