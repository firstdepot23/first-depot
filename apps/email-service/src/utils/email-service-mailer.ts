// Sends email through Resend's HTTPS API (port 443), so it is not affected
// by Render blocking outbound SMTP ports.
//
// Required environment variables:
//   RESEND_API_KEY  - API key from the Resend dashboard (sending access is enough)
//   EMAIL_FROM      - sender on a domain verified in Resend,
//                     e.g.  FIRSTDEPOT <noreply@your-domain.com>
//                     (for a quick test before verifying a domain, Resend lets
//                     you use onboarding@resend.dev, but only to your own
//                     Resend account email)

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set");
}
if (!EMAIL_FROM) {
  throw new Error("EMAIL_FROM is not set");
}

const sendMail = async ({
  email,
  subject,
  text,
}: {
  email: string;
  subject: string;
  text: string;
}) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject,
      text,
    }),
  });

  const raw = await res.text();

  if (!res.ok) {
    // Resend explains the problem in the body (unverified domain, bad key, etc.)
    throw new Error(`Resend request failed (${res.status}): ${raw.slice(0, 300)}`);
  }

  let id: string | undefined;
  try {
    id = JSON.parse(raw).id;
  } catch {
    // Body wasn't JSON; the send still succeeded.
  }

  console.log("MESSAGE SENT:", id ?? raw);
};

export default sendMail;