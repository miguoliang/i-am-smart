export interface PayPlan {
  type: "monthly" | "yearly";
  amountCents: number;
  description: string;
}

export const PAY_PLANS: Record<PayPlan["type"], PayPlan> = {
  monthly: {
    type: "monthly",
    amountCents: 2900,
    description: "i am smart Pro 月付",
  },
  yearly: {
    type: "yearly",
    amountCents: 19900,
    description: "i am smart Pro 年付",
  },
};

export function getPayPlan(planType: unknown): PayPlan | null {
  if (typeof planType !== "string") return null;
  return PAY_PLANS[planType as PayPlan["type"]] ?? null;
}

export function isValidPaidPlan(planType: string | null, amountTotal: number | null): boolean {
  const plan = getPayPlan(planType);
  return !!plan && amountTotal === plan.amountCents;
}
