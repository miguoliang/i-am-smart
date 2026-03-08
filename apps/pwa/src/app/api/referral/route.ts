import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET: get or create user's referral code + stats
export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    // Get or create referral code
    let { data: account } = await supabase
      .from("accounts")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (!account?.referral_code) {
      const code = generateCode();
      await supabase
        .from("accounts")
        .update({ referral_code: code })
        .eq("id", user.id);
      account = { referral_code: code };
    }

    // Get referral stats
    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, status, created_at")
      .eq("referrer_id", user.id);

    const total = referrals?.length ?? 0;
    const converted = referrals?.filter((r) => r.status === "converted").length ?? 0;

    return apiSuccess({
      code: account.referral_code,
      total,
      converted,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

// POST: register a referral (called during signup with ?ref=CODE)
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return apiSuccess({ message: "无效邀请码" });
    }

    const admin = createSupabaseAdmin();

    // Find referrer by code
    const { data: referrer } = await admin
      .from("accounts")
      .select("id")
      .eq("referral_code", code.toUpperCase())
      .single();

    if (!referrer || referrer.id === user.id) {
      return apiSuccess({ message: "邀请码无效或不能邀请自己" });
    }

    // Check if already referred
    const { data: existing } = await admin
      .from("accounts")
      .select("referred_by")
      .eq("id", user.id)
      .single();

    if (existing?.referred_by) {
      return apiSuccess({ message: "已有邀请记录" });
    }

    // Record referral
    await admin.from("referrals").insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      referral_code: code.toUpperCase(),
      status: "converted",
      converted_at: new Date().toISOString(),
    });

    // Update referred_by on account
    await admin
      .from("accounts")
      .update({ referred_by: referrer.id })
      .eq("id", user.id);

    return apiSuccess({ message: "邀请成功！" });
  } catch (e) {
    return handleApiError(e);
  }
}
