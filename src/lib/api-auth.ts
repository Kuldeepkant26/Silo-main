import { authClient } from "~/server/auth/client";

// ─── Session-based Auth Token Helpers ────────────────────────────────────────

/**
 * Extracts a properly formatted Bearer Authorization header value
 * from the BetterAuth session data returned by `authClient.useSession()`.
 *
 * Use this in React components where you already have the session from the hook.
 *
 * @param auth - The `data` property from `authClient.useSession()`
 * @returns Bearer token string, or undefined if no session is available yet
 */
export function getSessionAuthHeader(
  auth: { session?: { token?: string } } | null | undefined,
): string | undefined {
  const token = auth?.session?.token;
  if (!token) return undefined;
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

/**
 * Asynchronously fetches the current user's session token from BetterAuth.
 *
 * Use this in non-React / non-hook contexts (e.g. plain utility modules)
 * where the session data isn't available from a hook.
 *
 * BetterAuth `cookieCache` makes this efficient (reads from cookie within the
 * cache window, no extra network round-trip in most cases).
 *
 * @returns Bearer token string, or undefined if no session exists
 */
export async function getSessionAuthHeaderAsync(): Promise<string | undefined> {
  try {
    const { data } = await authClient.getSession();
    const token = data?.session?.token;
    if (token) {
      return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
  } catch {
    // Session unavailable — caller should handle undefined
  }
  return undefined;
}
