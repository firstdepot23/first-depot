// Server-only. Sends mail through Resend's HTTPS API. Unlike the email
// service's mailer this never throws at import time and never throws at
// all: callers get a result and decide what to do, so a missing key can't
// break the build or lose a customer's request.
//
// Env (set on the client app's Render service):
//   RESEND_API_KEY   sending key from Resend
//   EMAIL_FROM       e.g.  FIRSTDEPOT <noreply@first-depot.com>
//   RESEND_API_URL   optional, for tests only

export type MailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: boolean; error: string };

export const sendMail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<MailResult> => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY or EMAIL_FROM is not set",
    };
  }

  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject: subject.replace(/[\r\n]+/g, " ").slice(0, 200),
        text,
        ...(html ? { html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const raw = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        skipped: false,
        error: `Resend ${res.status}: ${raw.slice(0, 300)}`,
      };
    }
    let id: string | undefined;
    try {
      id = JSON.parse(raw).id;
    } catch {
      /* body wasn't JSON; the send still succeeded */
    }
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
