import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|//)).*)",
    "/((?!_next).*)",
    "/ (api|trpc)(.*)",
  ],
};
