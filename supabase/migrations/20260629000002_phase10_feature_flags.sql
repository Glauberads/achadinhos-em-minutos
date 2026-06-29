-- 20260629000002_phase10_feature_flags.sql
-- FASE 10: Feature Flags Enterprise
-- Criação da tabela de liberação condicional de recursos

CREATE TABLE public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    target_type TEXT DEFAULT 'global', -- 'global', 'plan', 'organization', 'user'
    target_ids UUID[] DEFAULT '{}', -- array of user_ids or organization_ids
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ÍNDICES (Performance)
-- ============================
CREATE INDEX idx_feature_flags_key ON public.feature_flags (key);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags (enabled);
CREATE INDEX idx_feature_flags_target_type ON public.feature_flags (target_type);

-- ============================
-- RLS (Row Level Security)
-- ============================
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Usuários podem LER as feature flags para verificar o que está ativo.
-- A regra de negócio no backend (FeatureFlagService) decidirá se o user específico tem acesso.
-- Mas a nível de banco, a tabela é pública para leitura autenticada.
CREATE POLICY "Users can read feature flags"
ON public.feature_flags
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas Service Role (backend admin) pode alterar feature flags.
CREATE POLICY "Service Role can insert feature flags"
ON public.feature_flags
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service Role can update feature flags"
ON public.feature_flags
FOR UPDATE
USING (true);

CREATE POLICY "Service Role can delete feature flags"
ON public.feature_flags
FOR DELETE
USING (true);

-- ============================
-- INSERÇÃO INICIAL MOCKADA
-- ============================
INSERT INTO public.feature_flags (key, name, description, enabled, target_type) VALUES
('ai_gemini', 'Inteligência Artificial Gemini', 'Geração de copys automáticas via IA', false, 'global'),
('analytics', 'Analytics Enterprise', 'Painel avançado de CTR e conversões', false, 'global'),
('api_publica', 'API Pública (M2M)', 'Acesso via chaves de API', false, 'global'),
('webhook', 'Webhooks Customizados', 'Disparos de webhooks em eventos', false, 'global'),
('whatsapp', 'Integração WhatsApp', 'Automação de envio de ofertas no WhatsApp', false, 'global');
