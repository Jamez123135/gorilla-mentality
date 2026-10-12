import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs";

const isPublicRoute = createRouteMatcher([
  "/",
  "/starter-pack(.*)",
  "/pricing(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/api/stripe/checkout(.*)",
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
