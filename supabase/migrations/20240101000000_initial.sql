-- Habilitar a extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_price DECIMAL(10,2),
  current_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2),
  image_url TEXT,
  source_url TEXT,
  affiliate_link TEXT,
  platform TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- platform_connections (Telegram Bot e Futuramente WhatsApp)
CREATE TABLE public.platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'telegram' ou 'whatsapp'
  access_token TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- groups (Canais/Grupos)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  group_name TEXT NOT NULL,
  external_group_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- system_logs
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- send_logs
CREATE TABLE public.send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.send_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem ver seus próprios produtos" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios produtos" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios produtos" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios produtos" ON public.products FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas conexões" ON public.platform_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem gerenciar suas conexões" ON public.platform_connections FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus grupos" ON public.groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem gerenciar seus grupos" ON public.groups FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus logs de sistema" ON public.system_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Apenas inserts para logs de sistema" ON public.system_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus logs de envio" ON public.send_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Apenas inserts para logs de envio" ON public.send_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função e Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
