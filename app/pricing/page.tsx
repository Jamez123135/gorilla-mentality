"use client";

import { motion } from "framer-motion";
import { Check, Zap, Shield, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert("Checkout failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 mb-6 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-xs font-bold uppercase tracking-widest"
        >
          Join the Elite
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
          Stop Guessing. <br />
          <span className="text-yellow-500">Start Dominating.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          The Starter Pack was just the beginning. Get full access to the Gorilla Hub, 
          professional tracking, and the blueprint for permanent growth.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="relative p-1 rounded-3xl bg-gradient-to-b from-yellow-500 to-orange-600 shadow-2xl shadow-yellow-500/20"
        >
          <div className="bg-zinc-900 rounded-[calc(1.5rem-1px)] p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase italic">Gorilla Premium</h3>
                <p className="text-zinc-500 text-sm">Full Jungle Access</p>
              </div>
              <div className="p-2 bg-yellow-500 rounded-lg text-black">
                <Crown className="w-6 h-6" />
              </div>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-black">$29</span>
              <span className="text-zinc-500 text-xl">/ month</span>
            </div>

            <ul className="space-y-4 mb-10">
              <FeatureItem icon={<Check className="text-yellow-500" />} text="Full Member Dashboard" />
              <FeatureItem icon={<Check className="text-yellow-500" />} text="Digital Workout Logger" />
              <FeatureItem icon={<Check className="text-yellow-500" />} text="Nutrition & Macro Tracker" />
              <FeatureItem icon={<Check className="text-yellow-500" />} text="Progress Photo Vault" />
              <FeatureItem icon={<Check className="text-yellow-500" />} text="Progressive Overload Analytics" />
              <FeatureItem icon={<Check className="text-yellow-500" />} text="Priority Coaching Access" />
            </ul>

            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Claim Your Spot
                </>
              )}
            </button>
            
            <p className="text-center text-zinc-600 text-xs mt-6">
              Cancel anytime. No contracts. Pure growth.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <li className="flex items-center gap-3 text-zinc-300 text-sm">
      <div className="shrink-0">{icon}</div>
      <span>{text}</span>
    </li>
  );
}
