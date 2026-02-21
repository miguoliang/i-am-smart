import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/calendar/feed.ics?token=<calendar_token>
 * Returns an iCalendar subscription feed with daily review reminders.
 * Authenticated via calendar_token (no Authorization header needed for calendar apps).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Look up account by calendar_token
  const { data: account, error } = await admin
    .from("accounts")
    .select("id, calendar_remind_hour")
    .eq("calendar_token", token)
    .single();

  if (error || !account) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const remindHour = account.calendar_remind_hour ?? 9;

  // Get due count for default profile (for description)
  const { data: profile } = await admin
    .from("learner_profiles")
    .select("id")
    .eq("account_id", account.id)
    .eq("is_default", true)
    .single();

  let dueCount = 0;
  if (profile) {
    const { data: stats } = await admin.rpc("get_profile_stats", {
      p_profile_id: profile.id,
    });
    if (stats) {
      dueCount = (stats as { dueToday: number }).dueToday ?? 0;
    }
  }

  const ics = generateICS(remindHour, dueCount);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="review-reminder.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

function generateICS(remindHour: number, dueToday: number): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//聪明的背单词工具//Review Reminder//CN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:聪明的背单词工具 - 复习提醒",
    "X-WR-CALDESC:每日复习提醒",
    "CALSCALE:GREGORIAN",
  ];

  // Generate events for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const hourStr = String(remindHour).padStart(2, "0");

    const description =
      i === 0 && dueToday > 0
        ? `今天还有 ${dueToday} 个词待复习`
        : "打开聪明的背单词工具，开始今天的复习吧";

    lines.push(
      "BEGIN:VEVENT",
      `UID:bif-review-${dateStr}@iamsmart.top`,
      `DTSTART:${dateStr}T${hourStr}0000`,
      `DTEND:${dateStr}T${hourStr}1500`,
      `SUMMARY:📚 聪明的背单词工具 - 今日复习`,
      `DESCRIPTION:${description}`,
      `URL:https://iamsmart.top/learn`,
      "BEGIN:VALARM",
      "TRIGGER:PT0M",
      "ACTION:DISPLAY",
      "DESCRIPTION:该复习了！",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
