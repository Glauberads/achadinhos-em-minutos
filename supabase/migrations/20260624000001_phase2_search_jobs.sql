-- 1. Criação da tabela product_search_jobs
CREATE TABLE IF NOT EXISTS public.product_search_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  keyword TEXT,
  category TEXT,
  filters JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  total_found INTEGER DEFAULT 0,
  total_imported INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- 2. Habilitar RLS em product_search_jobs
ALTER TABLE public.product_search_jobs ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas seus jobs
CREATE POLICY "Usuários podem ver seus jobs" 
ON public.product_search_jobs FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários criam apenas seus jobs
CREATE POLICY "Usuários podem criar seus jobs" 
ON public.product_search_jobs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus jobs (ex: cancelar, se precisar)
CREATE POLICY "Usuários podem atualizar seus jobs" 
ON public.product_search_jobs FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Adicionar campos na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS sold_count INTEGER,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- metadata já foi adicionado na migration anterior, mas garantimos que não falhe se existir.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='metadata') THEN
    ALTER TABLE public.products ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- 4. Padronizar plataforma para lowercase nos produtos existentes
UPDATE public.products SET platform = 'shopee' WHERE platform ILIKE 'shopee';
UPDATE public.products SET platform = 'mercadolivre' WHERE platform ILIKE '%mercado%livre%';
UPDATE public.products SET platform = 'manual' WHERE platform ILIKE 'manual';

-- 5. Criar índice único parcial para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_platform_external_id
ON public.products (user_id, platform, external_id)
WHERE external_id IS NOT NULL;
