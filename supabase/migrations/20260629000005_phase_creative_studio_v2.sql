-- Migration: 20260629000005_phase_creative_studio_v2.sql
-- Create Creative Studio V2 Enterprise Tables and Alterations

-- 1. Alter creatives table to support A/B testing and AI insights
ALTER TABLE public.creatives
ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES public.creatives(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS buyer_persona JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS creative_dna JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS quality_scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS conversion_score INT DEFAULT 0;

-- 2. Create the creative_analytics table for Learning Engine
CREATE TABLE IF NOT EXISTS public.creative_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES public.creatives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  category TEXT,
  template_used TEXT,
  hook_used TEXT,
  cta_used TEXT,
  emotion_used TEXT,
  mental_trigger TEXT,
  visual_style TEXT,
  duration_seconds INT,
  predominant_color TEXT,
  publish_time TIMESTAMPTZ,
  day_of_week TEXT,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  conversions INT DEFAULT 0,
  watch_time_avg INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_creative_id ON public.creative_analytics(creative_id);
CREATE INDEX IF NOT EXISTS idx_ca_user_id ON public.creative_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ca_marketplace ON public.creative_analytics(marketplace);

-- 3. RLS Policies for creative_analytics
ALTER TABLE public.creative_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own creative analytics"
  ON public.creative_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own creative analytics"
  ON public.creative_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creative analytics"
  ON public.creative_analytics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service Role can manage all creative analytics"
  ON public.creative_analytics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Storage Buckets Setup for Assets
-- Only insert if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('creative-assets', 'creative-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4', 'audio/mpeg', 'audio/wav'])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage Policies for 'creative-assets' bucket
CREATE POLICY "Public Access 'creative-assets' bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creative-assets');

CREATE POLICY "Users can upload to 'creative-assets' bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creative-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Service Role can manage 'creative-assets' bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'creative-assets' AND auth.jwt() ->> 'role' = 'service_role');
