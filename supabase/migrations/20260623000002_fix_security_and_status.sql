-- 1. Garante que products tenha status
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Garante que platform_connections tenha metadata
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Atualizar a tabela system_logs para o formato sugerido
DROP TABLE IF EXISTS public.system_logs;
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT NULL,
  level TEXT DEFAULT 'info',
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em system_logs novamente
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver seus logs de sistema" ON public.system_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Apenas inserts para logs de sistema" ON public.system_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Ajustar RLS de platform_connections para NÃO expor o access_token para o client (Frontend)
-- Vamos deletar a política anterior de SELECT
DROP POLICY IF EXISTS "Usuários podem ver suas conexões" ON public.platform_connections;
DROP POLICY IF EXISTS "Usuários podem gerenciar suas conexões" ON public.platform_connections;

-- Para máxima segurança, o Frontend NUNCA acessa a tabela platform_connections diretamente.
-- Tudo passa a ser pelo Backend via Service Role. 
-- Se for necessário ter RLS, desabilitamos SELECT direto pelo frontend, ou criamos uma VIEW.
-- Pela instrução: "o frontend não deve conseguir selecionar access_token"
-- Vamos remover as políticas públicas da platform_connections. Apenas o backend (Service Role) terá acesso.
