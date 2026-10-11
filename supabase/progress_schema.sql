-- PROGRESS PHOTO SCHEMA
CREATE TABLE progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label TEXT,
);

-- ENABLE RLS
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view own photos" ON progress_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own photos" ON progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON progress_photos FOR DELETE USING (auth.uid() = user_id);

-- STORAGE BUCKET CONFIGURATION
-- Note: You must manually create the "progress-photos" bucket in the Supabase Dashboard.
-- Then set the bucket to "Public" if you want easy URL access, or use authenticated URLs.
