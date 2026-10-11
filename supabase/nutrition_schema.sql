-- ADDING NUTRITION LOGS TABLE
CREATE TABLE nutrition_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  calories INTEGER,
  protein INTEGER,
  UNIQUE(user_id, log_date)
);

-- ENABLE RLS
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view own nutrition logs" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition logs" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition logs" ON nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
