import { afterEach, expect, it, vi } from "vitest";
import { isAuthConfigured } from "@/app/lib/auth-config";

afterEach(() => vi.unstubAllEnvs());

it("requires valid public and server keys before enabling member services", () => {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_...");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_...");
  expect(isAuthConfigured()).toBe(false);
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", `pk_test_${Buffer.from("sample-app-12.clerk.accounts.dev$").toString("base64")}`);
  expect(isAuthConfigured()).toBe(false);
  vi.stubEnv("CLERK_SECRET_KEY", `sk_test_${"a".repeat(32)}`);
  expect(isAuthConfigured()).toBe(true);
});
