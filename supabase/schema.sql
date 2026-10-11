-- 1. PROFILES TABLE
-- Extends the default auth.users table to store Gorilla Mentality specific intake data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Intake Data
  sex TEXT CHECK (sex IN ('male', 'female')),
  goal TEXT CHECK (goal IN ('fat loss', 'muscle gain', 'recomp')),
  current_weight FLOAT,
  target_weight FLOAT,
  training_experience TEXT,
  training_days INTEGER CHECK (training_days BETWEEN 3 AND 6),
  
  -- Nutrition Targets
  target_calories INTEGER,
  target_protein INTEGER
);

-- 2. EXERCISES TABLE
-- Central repository of all movements
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 3. WORKOUT_TEMPLATES TABLE
-- Defines the "Starter Pack" plans. 
-- A template consists of multiple exercises in a specific order.
CREATE TABLE workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_name TEXT NOT NULL, -- e.g., "Male-4Day-Push", "Female-5Day-Lower"
  day_number INTEGER,           -- Which day of the split this is
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER,         -- Position in the workout
  default_sets INTEGER,
  default_reps TEXT,           -- Using TEXT for ranges like "8-12"
  notes TEXT
);

-- 4. WORKOUT_LOGS TABLE
-- This is where the user's actual progress is stored
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  weight FLOAT,
  reps INTEGER,
  set_number INTEGER,
  workout_date DATE DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT false
);

-- ENABLE ROW LEVEL SECURITY (RLS)
-- This ensures users can only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Profiles: Users can read and update only their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workout Logs: Users can manage only their own logs
CREATE POLICY "Users can view own logs" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- Exercises & Templates: Everyone can read, but only admins (you) can edit (handled by Supabase Dashboard)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public exercises are viewable by everyone" ON exercises FOR SELECT USING (true);
CREATE POLICY "Templates are viewable by everyone" ON workout_templates FOR SELECT USING (true);
