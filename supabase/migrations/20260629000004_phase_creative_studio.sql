-- Migration: 20260629000004_phase_creative_studio.sql
-- Create Creative Studio table and Storage Buckets

-- 1. Create the creatives table
CREATE TABLE IF NOT EXISTS public.creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NULL,
  marketplace TEXT NOT NULL,
  product_url TEXT NOT NULL,
  affiliate_link TEXT NULL,
  title TEXT,
  description TEXT,
  script JSONB,
  scenes JSONB,
  thumbnail_url TEXT,
  video_url TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  generation_status TEXT DEFAULT 'pending',
  error_message TEXT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_creatives_status ON public.creatives(status);
CREATE INDEX IF NOT EXISTS idx_creatives_generation_status ON public.creatives(generation_status);
CREATE INDEX IF NOT EXISTS idx_creatives_marketplace ON public.creatives(marketplace);
CREATE INDEX IF NOT EXISTS idx_creatives_created_at ON public.creatives(created_at DESC);

-- 3. RLS Policies for creatives
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own creatives"
  ON public.creatives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own creatives"
  ON public.creatives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creatives"
  ON public.creatives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creatives"
  ON public.creatives FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service Role can manage all creatives"
  ON public.creatives FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 4. Storage Buckets Setup
-- Only insert if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('creatives', 'creatives', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('creative-videos', 'creative-videos', true, 52428800, ARRAY['video/mp4']),
  ('creative-thumbnails', 'creative-thumbnails', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage Policies
-- Policies for 'creatives' bucket
CREATE POLICY "Public Access 'creatives' bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creatives');

CREATE POLICY "Users can upload to 'creatives' bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creatives' AND auth.role() = 'authenticated');

CREATE POLICY "Service Role can manage 'creatives' bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'creatives' AND auth.jwt() ->> 'role' = 'service_role');

-- Policies for 'creative-videos' bucket
CREATE POLICY "Public Access 'creative-videos' bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creative-videos');

CREATE POLICY "Users can upload to 'creative-videos' bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creative-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Service Role can manage 'creative-videos' bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'creative-videos' AND auth.jwt() ->> 'role' = 'service_role');

-- Policies for 'creative-thumbnails' bucket
CREATE POLICY "Public Access 'creative-thumbnails' bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creative-thumbnails');

CREATE POLICY "Users can upload to 'creative-thumbnails' bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creative-thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Service Role can manage 'creative-thumbnails' bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'creative-thumbnails' AND auth.jwt() ->> 'role' = 'service_role');
