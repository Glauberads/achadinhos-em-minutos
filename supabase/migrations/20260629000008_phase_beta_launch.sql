-- ==============================================================================
-- MIGRATION: Beta Launch & Product Validation
-- ==============================================================================

-- 1. EARLY ACCESS STATUS (PROFILES)
-- Objetivo: Criar a hierarquia de status de usuário para Early Access

-- Como o schema public.profiles já existe, adicionamos a coluna `access_status`
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS access_status TEXT NOT NULL DEFAULT 'WAITLIST'
CHECK (access_status IN ('WAITLIST', 'INVITED', 'ACTIVE', 'SUSPENDED', 'BANNED', 'INTERNAL', 'BETA_TESTER', 'ADMIN'));


-- 2. SISTEMA DE CONVITES
-- Objetivo: Gerenciamento granular de acesso Beta

CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    target_role TEXT NOT NULL DEFAULT 'BETA_TESTER',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS invite_codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invite codes"
    ON public.invite_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.access_status IN ('ADMIN', 'INTERNAL')
        )
    );
CREATE POLICY "Anyone can read invite codes to validate"
    ON public.invite_codes FOR SELECT
    USING (true);


-- 3. SESSION ANALYSIS
-- Objetivo: Identificar abandono de sessão e rastreabilidade

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    device TEXT,
    browser TEXT,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions"
    ON public.user_sessions FOR ALL
    USING (auth.uid() = user_id);


-- 4. FEEDBACK (NPS)
-- Objetivo: Adicionar pergunta mandatória e escala 0-10

ALTER TABLE public.creative_feedbacks 
ADD COLUMN IF NOT EXISTS nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10);
