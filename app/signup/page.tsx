import { SignUp } from "@clerk/nextjs";
import { isAuthConfigured } from "@/app/lib/auth-config";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10 bg-black text-white">
      <h1 className="text-3xl font-black uppercase">Join Gorilla Mentality</h1>
      <p className="text-center text-zinc-400">
        Free membership. Workouts, meals, and progress in one place.
      </p>
      {isAuthConfigured() ? (
        <SignUp
          routing="hash"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
        />
      ) : (
        <>
          <p role="status" className="text-center text-zinc-400">
            Member registration is temporarily unavailable.
          </p>
          <Link href="/starter-pack" className="text-yellow-500 underline">
            Get your free starter plan
          </Link>
        </>
      )}
    </main>
  );
}
