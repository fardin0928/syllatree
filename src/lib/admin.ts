import "server-only";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "chill335_admin";

/**
 * Admin access model:
 * - If ADMIN_KEY is set in the environment, the key must match (cookie or header).
 * - If it is NOT set, admin is open in `next dev` only and locked in production.
 */
export function adminKeyMatches(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return process.env.NODE_ENV !== "production";
  return typeof key === "string" && key.length > 0 && key === expected;
}

export function adminNeedsLogin(): boolean {
  return Boolean(process.env.ADMIN_KEY);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return adminKeyMatches(jar.get(ADMIN_COOKIE)?.value);
}

export function isAdminRequest(req: Request): boolean {
  const header = req.headers.get("x-admin-key");
  if (adminKeyMatches(header)) return true;
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  return adminKeyMatches(cookie ? decodeURIComponent(cookie.slice(ADMIN_COOKIE.length + 1)) : null);
}
