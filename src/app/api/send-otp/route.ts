import { NextResponse } from "next/server";
import { Resend } from "resend";

import { OtpVerificationEmail } from "~/components/emails/otp-verification";
import { env } from "~/env";

// ---------------------------------------------------------------------------
// Server-side in-memory OTP store
// (survives hot-reloads in dev via `global`; use a DB/Redis in production)
// ---------------------------------------------------------------------------
type OtpEntry = { otp: string; expiresAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OtpEntry> | undefined;
}

const otpStore: Map<string, OtpEntry> =
  global.__otpStore ?? (global.__otpStore = new Map());

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// POST /api/send-otp
// Body: { email: string }
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const raw = body.email;

    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const email = normalizeEmail(raw);

    // Rate-limit: if a valid (not-yet-expired) OTP already exists, deny resend
    // unless the caller passes { resend: true } — handled below.
    const existing = otpStore.get(email);
    const now = Date.now();
    const resendAllowed =
      !existing || existing.expiresAt < now || (body as { resend?: boolean }).resend;

    if (!resendAllowed) {
      const secondsLeft = Math.ceil((existing!.expiresAt - now) / 1000);
      return NextResponse.json(
        { error: `Please wait ${secondsLeft}s before requesting a new code.` },
        { status: 429 },
      );
    }

    const otp = generateOtp();
    otpStore.set(email, { otp, expiresAt: now + OTP_TTL_MS });

    // Clean up stale entries (best-effort)
    for (const [key, entry] of otpStore.entries()) {
      if (entry.expiresAt < now) otpStore.delete(key);
    }

    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: email,
        subject: `${otp} is your Silo verification code`,
        react: OtpVerificationEmail({ otp, email }),
      });

      if (error) {
        console.error("[send-otp] Resend error:", error);
        return NextResponse.json(
          { error: "Failed to send email. Please try again." },
          { status: 500 },
        );
      }
    } else {
      // Development fallback — log to console when Resend is not configured
      console.log(`[send-otp] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
