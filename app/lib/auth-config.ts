import { isPublishableKey } from "@clerk/shared/keys";

export function isAuthConfigured() {
  const secret = process.env.CLERK_SECRET_KEY || "";
  return (
    isPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    /^sk_(test|live)_/.test(secret) &&
    secret.length > 20
  );
}
