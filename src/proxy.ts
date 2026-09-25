import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/auth/:path*", "/api/shop/:path*"],
};
