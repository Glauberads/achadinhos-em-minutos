-- ==============================================================================
-- MIGRATION: Market Readiness (Onboarding, Feedback e Product Usage)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- 1. USER ONBOARDING
-- Objetivo: Sincronizar estado de onboarding entre dispositivos, medir churn e TTFS.

CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_step TEXT NOT NULL DEFAULT 'welcome',
    completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    skipped_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding"
    ON public.user_onboarding FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding"
    ON public.user_onboarding FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding"
    ON public.user_onboarding FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- 2. CREATIVE FEEDBACKS (LEARNING ENGINE)
-- Objetivo: Avaliar cada criativo gerado (granularmente) para ML e evolução da IA.

CREATE TABLE IF NOT EXISTS public.creative_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id UUID NOT NULL REFERENCES public.creatives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    headline_rating INTEGER CHECK (headline_rating >= 1 AND headline_rating <= 5),
    copy_rating INTEGER CHECK (copy_rating >= 1 AND copy_rating <= 5),
    video_rating INTEGER CHECK (video_rating >= 1 AND video_rating <= 5),
    motion_rating INTEGER CHECK (motion_rating >= 1 AND motion_rating <= 5),
    cta_rating INTEGER CHECK (cta_rating >= 1 AND cta_rating <= 5),
    template_rating INTEGER CHECK (template_rating >= 1 AND template_rating <= 5),
    
    generated_with_fallback BOOLEAN DEFAULT false,
    would_publish BOOLEAN DEFAULT false,
    
    -- Array de motivos (ex: Hook fraco, CTA ruim, Visual excelente)
    reason_tags TEXT[] DEFAULT '{}',
    comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para creative_feedbacks
ALTER TABLE public.creative_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedbacks"
    ON public.creative_feedbacks FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can view their own feedbacks"
    ON public.creative_feedbacks FOR SELECT
    USING (auth.uid() = user_id);


-- 3. PRODUCT USAGE EVENTS
-- Objetivo: Separar Telemetria Técnica de Adoção de Produto (TTFS, Funil).

CREATE TABLE IF NOT EXISTS public.product_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL, -- Ex: SIGNUP_COMPLETE, FIRST_CREATIVE_GENERATED, ONBOARDING_COMPLETED
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para product_usage_events
ALTER TABLE public.product_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own usage events"
    ON public.product_usage_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage events"
    ON public.product_usage_events FOR SELECT
    USING (auth.uid() = user_id);


-- Triggers para Updated At
CREATE TRIGGER handle_updated_at_user_onboarding
    BEFORE UPDATE ON public.user_onboarding
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
