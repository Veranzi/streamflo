import type { Session } from "next-auth";
import { query } from "./db";

export type AuditEntry = {
  action: string;               // e.g. "school.approve"
  targetType?: string;          // e.g. "school"
  targetId?: string | number | null;
  summary?: string;             // one readable line for the activity page
  details?: Record<string, unknown>;
};

/** Name shown in the trail: the admin's username (admins table) or account name. */
export function adminName(session: Session | null | undefined): string {
  const u = session?.user;
  return String(u?.name || u?.email || "unknown admin").slice(0, 150);
}

/**
 * Record an admin action in admin_audit_log. Call it after the change succeeded.
 * Never throws: a logging failure must not undo or block the admin's action.
 */
export async function logAdminAction(session: Session | null | undefined, entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO admin_audit_log (admin_username, action, target_type, target_id, summary, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminName(session),
        entry.action.slice(0, 60),
        entry.targetType ?? null,
        entry.targetId == null ? null : String(entry.targetId).slice(0, 40),
        entry.summary ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
      ]
    );
  } catch (err) {
    console.error("[audit] could not record admin action", entry.action, (err as Error).message);
  }
}
