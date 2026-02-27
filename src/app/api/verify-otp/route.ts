import { NextResponse } from "next/server";

// Re-use the same global store written by send-otp
type OtpEntry = { otp: string; expiresAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OtpEntry> | undefined;
}

const otpStore: Map<string, OtpEntry> =
  global.__otpStore ?? (global.__otpStore = new Map());

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// POST /api/verify-otp
// Body: { email: string; otp: string }
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; otp?: string };

    if (!body.email || !body.otp) {
      return NextResponse.json(
        { error: "Email and OTP are required." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(body.email);
    const entry = otpStore.get(email);

    if (!entry) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 },
      );
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (entry.otp !== body.otp.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 },
      );
    }

    // Consume the OTP so it can't be reused
    otpStore.delete(email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
