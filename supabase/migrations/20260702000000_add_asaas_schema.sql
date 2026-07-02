-- Adicionando colunas ao profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending';

-- Billing Plans
CREATE TABLE IF NOT EXISTS public.billing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    interval TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.billing_plans (id, name, price, interval)
VALUES ('pro', 'Pro Plan', 98.77, 'monthly')
ON CONFLICT (id) DO NOTHING;

-- Modificando user_subscriptions (adicionando user_id se faltar, caso exista de migrations antigas)
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Nova tabela de payments (Faturas avulsas/PIX/Cartão)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'asaas'
    provider_payment_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL, -- 'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE'
    billing_type TEXT NOT NULL, -- 'PIX', 'CREDIT_CARD'
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando RLS para a tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);
