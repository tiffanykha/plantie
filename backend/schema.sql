-- Schema for Plantie

-- We don't need a custom 'users' table because we are using Supabase Auth's built-in auth.users
-- We will link all data directly to auth.uid()

-- 1. Plants Table
CREATE TABLE plants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  water_frequency_days INTEGER NOT NULL DEFAULT 7,
  light_requirement TEXT,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'thirsty', 'overwatered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on plants
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- Plants Policies: Users can only see and modify their own plants
CREATE POLICY "Users can view their own plants" ON plants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plants" ON plants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plants" ON plants FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plants" ON plants FOR DELETE USING (auth.uid() = user_id);

-- 2. Photos Table
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Photos Policies: Users can only see and insert photos for plants they own
CREATE POLICY "Users can view photos of their plants" ON photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM plants WHERE plants.id = photos.plant_id AND plants.user_id = auth.uid())
);
CREATE POLICY "Users can insert photos of their plants" ON photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM plants WHERE plants.id = photos.plant_id AND plants.user_id = auth.uid())
);
CREATE POLICY "Users can delete photos of their plants" ON photos FOR DELETE USING (
  EXISTS (SELECT 1 FROM plants WHERE plants.id = photos.plant_id AND plants.user_id = auth.uid())
);

-- 3. Care Logs Table
CREATE TABLE care_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('watered', 'misted', 'fertilized', 'photo_added')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on care_logs
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

-- Care Logs Policies: Users can only see and insert logs for plants they own
CREATE POLICY "Users can view logs of their plants" ON care_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM plants WHERE plants.id = care_logs.plant_id AND plants.user_id = auth.uid())
);
CREATE POLICY "Users can insert logs for their plants" ON care_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM plants WHERE plants.id = care_logs.plant_id AND plants.user_id = auth.uid())
);
CREATE POLICY "Users can delete logs for their plants" ON care_logs FOR DELETE USING (
  EXISTS (SELECT 1 FROM plants WHERE plants.id = care_logs.plant_id AND plants.user_id = auth.uid())
);

-- Create storage bucket for plant images if hasn't been created yet
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for plant-photos bucket
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'plant-photos' );

CREATE POLICY "Authenticated users can upload photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'plant-photos' AND auth.role() = 'authenticated' );
