-- Migration para inserção da feature flag do Creative OS
-- ID: 20260701000000
-- Descrição: Insere a flag creative_os para ativar o novo pipeline multi-motores.

INSERT INTO feature_flags (
    id,
    key,
    name,
    description,
    enabled,
    target_type,
    target_ids,
    metadata
) VALUES (
    gen_random_uuid(),
    'creative_os',
    'Creative Operating System (V3)',
    'Habilita o novo pipeline modular de geração de criativos (Layout, Color, Typography, Hook, etc). Quando desabilitado, usa o monolítico V2.',
    false,
    'global',
    '{}',
    '{"version": "3.0", "module": "creative_studio", "type": "pipeline"}'::jsonb
);
