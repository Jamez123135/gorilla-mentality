"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Send, Trophy, Star, Shield, User, Target } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function CoachingPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    goal: "",
    experience: "new",
    message: "",
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in first to apply for coaching.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/coaching/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          fullName: user.fullName || "Unknown",
          email: user.primaryEmailAddress?.emailAddress || "",
          ...formData,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit application");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
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
          Apply for Elite Access
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">
          One-on-One <br />
          <span className="text-yellow-500">Elite Coaching</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          The app gives you the blueprint. I give you the execution. 
          Apply below to see if you're a fit for the inner circle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
        {/* Value Props */}
        <div className="space-y-8 py-8">
          <div className="space-y-6">
            <ValueCard 
              icon={<Trophy className="w-6 h-6" />} 
              title="Custom Programming" 
              text="A periodized plan built around your specific biology, schedule, and goals." 
            />
            <ValueCard 
              icon={<Star className="w-6 h-6" />} 
              title="Direct Accountability" 
              text="Weekly check-ins and constant communication to keep you on track." 
            />
            <ValueCard 
              icon={<Shield className="w-6 h-6" />} 
              title="Form Correction" 
              text="Video analysis of your lifts to ensure maximum safety and growth." 
            />
          </div>
        </div>

        {/* Application Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleApply} 
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black uppercase italic mb-2">The Application</h3>
                  <p className="text-zinc-500 text-sm">Serious athletes only.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 ml-1">Your Primary Goal</label>
                  <input 
                    required
                    value={formData.goal}
                    onChange={e => setFormData({...formData, goal: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all text-white"
                    placeholder="e.g. Gain 5kg muscle, lose fat..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 ml-1">Training Experience</label>
                  <select 
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all text-white"
                  >
                    <option value="new">Beginner (0-1 year)</option>
                    <option value="consistent">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 ml-1">Why should I coach you?</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all text-white resize-none"
                    placeholder="Tell me about your dedication and what you've tried before..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-yellow-500" />
                </div>
                <h3 className="text-3xl font-black uppercase italic">Application Received</h3>
                <p className="text-zinc-400">I'll review your profile and reach out if we're a match. Keep training hard in the meantime.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-yellow-500 hover:underline text-sm font-medium"
                >
                  Submit another application
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function ValueCard({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl transition-all hover:border-yellow-500/30 group">
      <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
