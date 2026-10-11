"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      // Supabase by default requires email confirmation.
      // If you disable it in settings, the user is logged in immediately.
      setError("Check your email for the confirmation link to activate your account!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
            Join the <span className="text-yellow-500">Pride</span>
          </h1>
          <p className="text-zinc-400">Stop guessing. Start growing.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all text-white"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all text-white"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className={`p-3 rounded-lg border text-sm text-center ${
              error.includes("Check your email") 
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" 
                : "bg-red-500/10 border-red-500/20 text-red-500"
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim Your Spot"}
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-500 text-sm">
          Already a member?{" "}
          <a href="/login" className="text-yellow-500 hover:underline font-medium">
            Sign In
          </a>
        </p>
      </motion.div>
    </div>
  );
}
