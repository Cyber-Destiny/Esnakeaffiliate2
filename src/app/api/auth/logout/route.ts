import { ok, withErrors } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export const POST = withErrors(async () => {
  await clearAuthCookie();
  return ok({ success: true });
});
