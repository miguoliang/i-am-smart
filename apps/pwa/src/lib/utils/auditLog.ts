import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface AuditLogEntry {
  operator_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  detail?: Record<string, unknown>;
}

/**
 * Write an audit log entry. Fire-and-forget — does not throw on failure.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createSupabaseAdmin();
    await admin.from("operator_logs").insert({
      operator_id: entry.operator_id,
      action: entry.action,
      target_type: entry.target_type ?? null,
      target_id: entry.target_id ?? null,
      detail: entry.detail ?? null,
    });
  } catch {
    // Silently ignore — audit logging should never break the main flow
  }
}
