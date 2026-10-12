import { test } from "@playwright/test";
import { clerkSetup } from "@clerk/testing/playwright";

test("configure development authentication tests", async () => {
  if (
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")
  )
    await clerkSetup();
});
