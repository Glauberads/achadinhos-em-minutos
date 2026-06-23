-- 1. Criação da tabela Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- shopee, mercadolivre, both
  keyword TEXT,
  category TEXT,
  filters JSONB DEFAULT '{}',
  telegram_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  recurrence_cron TEXT NOT NULL, -- ex: '0 * * * *' para hora em hora
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, paused, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criação da tabela Scheduled Posts
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  send_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, queued, sent, failed, cancelled
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criação da tabela Queue Locks (Fallback se não usar apenas Redis)
CREATE TABLE IF NOT EXISTS public.queue_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lock_key TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Unique Partial Index Anti-Duplicidade do Motor
CREATE UNIQUE INDEX IF NOT EXISTS unique_scheduled_post_delivery
ON public.scheduled_posts (user_id, product_id, group_id)
WHERE status IN ('pending', 'queued', 'sent');

-- 5. RLS - Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_locks ENABLE ROW LEVEL SECURITY;

-- Políticas para campaigns
CREATE POLICY "Usuários veem suas campanhas" ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários criam suas campanhas" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários atualizam suas campanhas" ON public.campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários deletam suas campanhas" ON public.campaigns FOR DELETE USING (auth.uid() = user_id);

-- Políticas para scheduled_posts
CREATE POLICY "Usuários veem seus posts agendados" ON public.scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários criam seus posts agendados" ON public.scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários atualizam seus posts agendados" ON public.scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários deletam seus posts agendados" ON public.scheduled_posts FOR DELETE USING (auth.uid() = user_id);

-- Políticas para queue_locks
CREATE POLICY "Usuários veem seus locks" ON public.queue_locks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários gerenciam seus locks" ON public.queue_locks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
