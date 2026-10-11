"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Minus, Trash2, Play, Save } from "lucide-react";

interface SetLog {
  set_number: number;
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseLog {
  id: string;
  name: string;
  default_sets: number;
  default_reps: string;
  sets: SetLog[];
}

export default function WorkoutLogger() {
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<{ title: string; exercises: ExerciseLog[] } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadWorkout() {
      setLoading(true);
      
      // 1. Get user profile to know which template to load
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .single();

      if (!profile) {
        console.error("No profile found");
        setLoading(false);
        return;
      }

      // 2. Fetch the first workout template for their profile
      // In a full app, we'd track which 'day' they are on. For now, we load Day 1.
      const { data: templateData } = await supabase
        .from("workout_templates")
        .select(`
          template_name,
          day_number,
          order_index,
          default_sets,
          default_reps,
          exercises (name)
        `)
        .eq("day_number", 1)
        .order("order_index", { ascending: true });

      if (templateData && templateData.length > 0) {
        const exercises = templateData.map(t => ({
          id: t.exercises?.id || Math.random().toString(), // Fallback
          name: t.exercises?.name || "Unknown Exercise",
          default_sets: t.default_sets || 3,
          default_reps: t.default_reps || "8-12",
          sets: Array.from({ length: t.default_sets || 3 }, (_, i) => ({
            set_number: i + 1,
            weight: "",
            reps: "",
            completed: false,
          }))
        }));

        setWorkout({
          title: templateData[0].template_name,
          exercises
        });
      }

      setLoading(false);
    }

    loadWorkout();
  }, []);

  const updateSet = (exIndex: number, setIndex: number, field: keyof SetLog, value: any) => {
    const newWorkout = { ...workout };
    if (newWorkout) {
      newWorkout.exercises[exIndex].sets[setIndex] = {
        ...newWorkout.exercises[exIndex].sets[setIndex],
        [field]: value
      };
      setWorkout(newWorkout);
    }
  };

  const toggleComplete = (exIndex: number, setIndex: number) => {
    const newWorkout = { ...workout };
    if (newWorkout) {
      const set = newWorkout.exercises[exIndex].sets[setIndex];
      updateSet(exIndex, setIndex, "completed", !set.completed);
    }
  };

  const saveWorkout = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const logs: any[] = [];
      workout?.exercises.forEach((ex, exIdx) => {
        ex.sets.forEach((set, setIdx) => {
          if (set.weight || set.reps) {
            logs.push({
              user_id: session.user.id,
              exercise_id: ex.id,
              weight: parseFloat(set.weight),
              reps: parseInt(set.reps),
              set_number: set.set_number,
              workout_date: new Date().toISOString().split('T')[0],
              is_completed: set.completed
            });
          }
        });
      });

      const { error } = await supabase.from("workout_logs").insert(logs);
      if (error) throw error;
      alert("Workout saved to the jungle!");
    } catch (e) {
      console.error(e);
      alert("Error saving workout");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Workout...</div>;
  if (!workout) return <div className="min-h-screen bg-black text-white flex items-center justify-center">No workout found for your profile.</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <header className="max-w-3xl mx-auto flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            {workout.title.replace(/-/g, ' ')}
          </h1>
          <p className="text-zinc-500">Log your progressive overload</p>
        </div>
        <button 
          onClick={saveWorkout}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Save Session
        </button>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        {workout.exercises.map((ex, exIdx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: exIdx * 0.1 }}
            key={ex.id} 
            className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-zinc-100">{ex.name}</h3>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                Target: {ex.default_reps}
              </span>
            </div>

            <div className="space-y-3">
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="grid grid-cols-[40px_1fr_1fr_40px] gap-4 items-center">
                  <span className="text-zinc-500 font-bold text-center">{set.set_number}</span>
                  
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="kg/lbs" 
                      value={set.weight}
                      onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-center focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="reps" 
                      value={set.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-center focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                    />
                  </div>

                  <button 
                    onClick={() => toggleComplete(exIdx, setIdx)}
                    className={`p-2 rounded-lg transition-all ${set.completed ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
