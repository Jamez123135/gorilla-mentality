import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that can be accessed by anyone, including signed-out users
  publicRoutes: ["/", "/starter-pack", "/pricing", "/login", "/signup", "/api/stripe/checkout"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
