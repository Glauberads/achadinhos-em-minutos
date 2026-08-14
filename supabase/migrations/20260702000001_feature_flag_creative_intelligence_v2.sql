-- Criação da feature flag para o Creative Intelligence V2
INSERT INTO feature_flags (name, is_enabled, description, updated_at)
VALUES (
    'creative_intelligence_v2', 
    false, 
    'Habilita o novo pipeline do Creative Intelligence (CreativeDNA V2, Prompt Builder e Quality Reviewer granulares)', 
    now()
)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    updated_at = now();
