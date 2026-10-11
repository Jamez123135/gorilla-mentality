"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Dumbbell, Utensils, User, LogOut, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    }

    getSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            Gorilla <span className="text-yellow-500">Hub</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Overview" active />
          <NavItem icon={<Dumbbell />} label="Workouts" />
          <NavItem icon={<Utensils />} label="Nutrition" />
          <NavItem icon={<TrendingUp />} label="Progress" />
          <NavItem icon={<User />} label="Profile" />
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back, {profile?.full_name || "Warrior"}</h2>
          <p className="text-zinc-400">Here is your Gorilla Mentality status.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Current Goal" 
            value={profile?.goal || "Not Set"} 
            subtext="Focus Area" 
          />
          <StatCard 
            label="Daily Calories" 
            value={profile?.target_calories ? `${profile.target_calories} kcal` : "---"} 
            subtext="Target Intake" 
          />
          <StatCard 
            label="Daily Protein" 
            value={profile?.target_protein ? `${profile.target_protein}g` : "---"} 
            subtext="Muscle Growth" 
          />
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center">
          <Dumbbell className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">No active workout logged today</h3>
          <p className="text-zinc-400 mb-6 max-w-md">
            Time to hit the jungle. Start your session to track your progressive overload.
          </p>
          <button className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all uppercase tracking-wider">
            Start Workout
          </button>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${
        active ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function StatCard({ label, value, subtext }: { label: string, value: string, subtext: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl"
    >
      <p className="text-zinc-500 text-sm font-medium">{label}</p>
      <h4 className="text-2xl font-black my-1">{value}</h4>
      <p className="text-zinc-600 text-xs uppercase tracking-widest">{subtext}</p>
    </motion.div>
  );
}
