-- Migration: 20260630000011_fix_feature_flags_creative.sql
-- Insere a feature flag do Creative Studio AI que estava faltando
-- e habilita ela globalmente para acesso de todos os usuários

INSERT INTO public.feature_flags (key, name, description, enabled, target_type)
VALUES (
  'creative_studio_ai',
  'Creative Studio AI',
  'Módulo de geração automática de vídeos e criativos via IA a partir de links de produtos',
  true,
  'global'
)
ON CONFLICT (key) DO UPDATE SET
  enabled = true,
  target_type = 'global',
  updated_at = NOW();

-- Habilitar também as outras flags essenciais que estavam desativadas
UPDATE public.feature_flags SET enabled = true WHERE key IN ('ai_gemini', 'analytics');
