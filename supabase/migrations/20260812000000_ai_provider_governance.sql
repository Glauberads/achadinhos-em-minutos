-- Migration: 20260812000000_ai_provider_governance.sql

-- 1. profiles.platform_role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platform_role text DEFAULT NULL;
ALTER TABLE profiles ADD CONSTRAINT chk_platform_role CHECK (platform_role IS NULL OR platform_role = 'superadmin');

-- Prevent self-promotion
CREATE OR REPLACE FUNCTION public.protect_platform_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If the update is coming from an authenticated user (frontend client)
  IF auth.role() = 'authenticated' OR auth.role() = 'anon' THEN
    -- Force platform_role to remain unchanged
    NEW.platform_role = OLD.platform_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_platform_role_trigger ON profiles;
CREATE TRIGGER protect_platform_role_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_platform_role();

-- 2. ai_providers
CREATE TABLE IF NOT EXISTS ai_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_type text NOT NULL,
    display_name text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_provider_type CHECK (provider_type IN ('gemini', 'openai', 'runway'))
);

-- 3. ai_provider_credentials
CREATE TABLE IF NOT EXISTS ai_provider_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    encrypted_payload text NOT NULL,
    key_version text NOT NULL DEFAULT '1',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_provider_credential UNIQUE (provider_id)
);

-- 4. ai_provider_models
CREATE TABLE IF NOT EXISTS ai_provider_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    model_key text NOT NULL,
    display_name text NOT NULL,
    capabilities text[] NOT NULL DEFAULT '{}',
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_provider_model UNIQUE (provider_id, model_key)
);

-- 5. ai_capability_routes
CREATE TABLE IF NOT EXISTS ai_capability_routes (
    capability text PRIMARY KEY,
    primary_provider_id uuid NOT NULL REFERENCES ai_providers(id) ON DELETE RESTRICT,
    primary_model_id uuid NOT NULL REFERENCES ai_provider_models(id) ON DELETE RESTRICT,
    fallback_provider_id uuid REFERENCES ai_providers(id) ON DELETE SET NULL,
    fallback_model_id uuid REFERENCES ai_provider_models(id) ON DELETE SET NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_capability CHECK (capability IN ('structured-generation', 'text-generation', 'image-generation', 'video-generation'))
);

-- 6. RLS Policies
-- Enable RLS to enforce server-only access
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_capability_routes ENABLE ROW LEVEL SECURITY;

-- Note: No policies are created for standard roles (anon, authenticated). 
-- This means default deny for all clients. The Node.js server using Supabase Service Role Key 
-- will bypass RLS entirely to read/write these tables.
