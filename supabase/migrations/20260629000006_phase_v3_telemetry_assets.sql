-- Migration V3: Telemetry and Asset Library
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Telemetry Logs Table
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    operation_type VARCHAR(50) NOT NULL, -- e.g., 'API_REQUEST', 'WORKER_JOB', 'AI_GENERATION', 'FFMPEG_RENDER'
    endpoint VARCHAR(255),
    total_time_ms INTEGER NOT NULL,
    queue_time_ms INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'ERROR', 'TIMEOUT', 'FALLBACK'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for reporting
CREATE INDEX idx_telemetry_logs_type_status ON telemetry_logs(operation_type, status);
CREATE INDEX idx_telemetry_logs_created_at ON telemetry_logs(created_at);

-- 2. Asset Library Tables
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'font'
    tags TEXT[],
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate Initial Asset Categories
INSERT INTO asset_categories (name, slug, description) VALUES
('Backgrounds', 'backgrounds', 'Fundo de vídeos e animações'),
('Gradientes', 'gradientes', 'Sobreposições em gradiente'),
('Overlays', 'overlays', 'Efeitos visuais sobrepostos'),
('Stickers', 'stickers', 'Adesivos animados'),
('Selos', 'selos', 'Selos de oferta e confiança'),
('Ícones', 'icones', 'Ícones vetoriais em PNG/SVG'),
('Partículas', 'particulas', 'Efeitos de poeira e brilho'),
('Molduras', 'molduras', 'Bordas de dispositivos e vídeo'),
('Shapes', 'shapes', 'Formas geométricas'),
('Call To Actions', 'ctas', 'Botões animados de Clique Aqui'),
('Price Tags', 'price-tags', 'Etiquetas de preço dinâmicas'),
('Discount Tags', 'discount-tags', 'Selos de desconto'),
('Transitions', 'transitions', 'Vídeos de transição em alpha'),
('Music', 'music', 'Trilhas sonoras de fundo'),
('Sound Effects', 'sound-effects', 'Swooshes, pops e clicks'),
('Fonts', 'fonts', 'Fontes de texto customizadas')
ON CONFLICT (slug) DO NOTHING;

-- Pre-populate some dummy assets for demonstration
DO $$
DECLARE
    bg_id UUID;
    music_id UUID;
    selos_id UUID;
BEGIN
    SELECT id INTO bg_id FROM asset_categories WHERE slug = 'backgrounds' LIMIT 1;
    SELECT id INTO music_id FROM asset_categories WHERE slug = 'music' LIMIT 1;
    SELECT id INTO selos_id FROM asset_categories WHERE slug = 'selos' LIMIT 1;

    IF bg_id IS NOT NULL THEN
        INSERT INTO assets (category_id, title, url, type, tags) VALUES
        (bg_id, 'Neon Cyberpunk Loop', 'https://mock.url/bg1.mp4', 'video', ARRAY['neon', 'loop', 'dark']),
        (bg_id, 'Soft Pastel Gradient', 'https://mock.url/bg2.mp4', 'video', ARRAY['soft', 'clean', 'light'])
        ON CONFLICT DO NOTHING;
    END IF;

    IF selos_id IS NOT NULL THEN
        INSERT INTO assets (category_id, title, url, type, tags) VALUES
        (selos_id, 'Frete Grátis Ouro', 'https://mock.url/selo1.png', 'image', ARRAY['frete', 'ouro', 'conversao']),
        (selos_id, 'Garantia 7 Dias', 'https://mock.url/selo2.png', 'image', ARRAY['garantia', 'trust'])
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
