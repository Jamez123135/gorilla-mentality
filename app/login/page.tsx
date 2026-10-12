import { SignIn } from "@clerk/nextjs";
import { isAuthConfigured } from "@/app/lib/auth-config";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10 bg-black text-white">
      <h1 className="text-3xl font-black uppercase">Member Login</h1>
      {isAuthConfigured() ? (
        <SignIn
          routing="hash"
          signUpUrl="/signup"
          fallbackRedirectUrl="/dashboard"
        />
      ) : (
        <>
          <p role="status" className="text-center text-zinc-400">
            Member sign-in is temporarily unavailable.
          </p>
          <Link href="/starter-pack" className="text-yellow-500 underline">
            Get your free starter plan
          </Link>
        </>
      )}
    </main>
  );
}
