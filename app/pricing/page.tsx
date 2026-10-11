"use client";

import { motion } from "framer-motion";
import { Check, Zap, Shield, Trophy, Star, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function CoachingPage() {
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert("Booking failed. Please try again.");
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
          Exclusive Access
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
          One-on-One <br />
          <span className="text-yellow-500">Elite Coaching</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          The app gives you the blueprint. I give you the execution. 
          Get direct, personalized guidance to break through your plateaus and rebuild your physique.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Custom Programming</h3>
                <p className="text-zinc-400 text-sm">Not a template. A plan built around your specific biology and schedule.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Direct Accountability</h3>
                <p className="text-zinc-400 text-sm">Weekly check-ins to ensure you're hitting your numbers and recovering right.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Form Correction</h3>
                <p className="text-zinc-400 text-sm">Video analysis of your lifts to maximize growth and eliminate injury risk.</p>
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="relative p-1 rounded-3xl bg-gradient-to-b from-yellow-500 to-orange-600 shadow-2xl shadow-yellow-500/20"
        >
          <div className="bg-zinc-900 rounded-[calc(1.5rem-1px)] p-8 text-center">
            <h3 className="text-2xl font-black uppercase italic mb-2">Secure Your Spot</h3>
            <p className="text-zinc-500 text-sm mb-8">Initial Consultation & Onboarding</p>

            <div className="mb-8">
              <span className="text-6xl font-black">$149</span>
              <span className="text-zinc-500 text-xl">/ deposit</span>
            </div>

            <button 
              onClick={handleBooking}
              disabled={loading}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Apply Now <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="mt-6 text-zinc-600 text-xs">
              Payment secures your consultation call. <br />
              Limited spots available per month.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
