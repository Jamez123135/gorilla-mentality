import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { isAuthConfigured } from "@/app/lib/auth-config";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

const withClerk = clerkMiddleware(
  async (auth, request) => {
    if (isApiRoute(request)) {
      const { userId } = await auth();
      if (!userId)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (isProtectedRoute(request)) await auth.protect();
  },
  { signInUrl: "/login", signUpUrl: "/signup" },
);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isAuthConfigured()) {
    if (isApiRoute(request)) {
      return NextResponse.json(
        { error: "Member services are temporarily unavailable" },
        { status: 503 },
      );
    }
    if (isProtectedRoute(request))
      return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
