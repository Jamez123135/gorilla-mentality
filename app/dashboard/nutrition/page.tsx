"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Utensils, Plus, Minus, Save, CheckCircle2, Flame, Dumbbell } from "lucide-react";
import { getNutritionData, saveNutritionLog } from "@/app/lib/actions/nutrition";

interface DailyLog {
  calories: number;
  protein: number;
  date: string;
}

export default function NutritionTracker() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentLog, setCurrentLog] = useState({ calories: 0, protein: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchNutritionData() {
      setLoading(true);
      try {
        const data = await getNutritionData();
        setProfile(data.profile);

        if (data.log) {
          setCurrentLog({
            calories: data.log.calories || 0,
            protein: data.log.protein || 0
          });
        }
      } catch (e) {
        console.error("Error fetching nutrition data:", e);
      }
      setLoading(false);
    }

    fetchNutritionData();
  }, []);

  const adjustValue = (field: keyof typeof currentLog, amount: number) => {
    setCurrentLog(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount)
    }));
  };

  const saveNutrition = async () => {
    setSaving(true);
    try {
      await saveNutritionLog(currentLog.calories, currentLog.protein);
      alert("Nutrition logged for today!");
    } catch (e) {
      console.error(e);
      alert("Error saving nutrition");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Nutrition...</div>;
  if (!profile) return <div className="min-h-screen bg-black text-white flex items-center justify-center">No profile found. Please complete the intake.</div>;

  const calProgress = Math.min(100, (currentLog.calories / (profile.targetCalories || 1)) * 100);
  const proProgress = Math.min(100, (currentLog.protein / (profile.targetProtein || 1)) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <header className="max-w-3xl mx-auto flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            Fuel <span className="text-yellow-500">Station</span>
          </h1>
          <p className="text-zinc-500">Track your daily intake vs Gorilla targets</p>
        </div>
        <button
          onClick={saveNutrition}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save Log
        </button>
      </header>

      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calories Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-2xl">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold">Calories</h3>
          </div>

          <div className="text-center mb-8">
            <span className="text-5xl font-black">{currentLog.calories}</span>
            <span className="text-zinc-500 text-xl ml-2">/ {profile.targetCalories}</span>
          </div>

          <div className="w-full bg-zinc-800 h-4 rounded-full mb-8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calProgress}%` }}
              className="h-full bg-orange-500"
            />
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => adjustValue("calories", -100)}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"
            >
              <Minus className="w-6 h-6" />
            </button>
            <button
              onClick={() => adjustValue("calories", 100)}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        {/* Protein Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Dumbbell className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold">Protein (g)</h3>
          </div>

          <div className="text-center mb-8">
            <span className="text-5xl font-black">{currentLog.protein}</span>
            <span className="text-zinc-500 text-xl ml-2">/ {profile.targetProtein}</span>
          </div>

          <div className="w-full bg-zinc-800 h-4 rounded-full mb-8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${proProgress}%` }}
              className="h-full bg-blue-500"
            />
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => adjustValue("protein", -10)}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"
            >
              <Minus className="w-6 h-6" />
            </button>
            <button
              onClick={() => adjustValue("protein", 10)}
              className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
