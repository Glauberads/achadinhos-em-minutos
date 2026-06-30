-- ==============================================================================
-- MIGRATION: Go Live Enterprise - Billing Readiness (Abstração)
-- ==============================================================================

-- 1. BILLING PROVIDERS
CREATE TABLE IF NOT EXISTS public.billing_providers (
    id TEXT PRIMARY KEY, -- 'stripe', 'pagarme', 'asaas'
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb
);

INSERT INTO public.billing_providers (id, name) VALUES ('stripe', 'Stripe') ON CONFLICT DO NOTHING;
INSERT INTO public.billing_providers (id, name) VALUES ('pagarme', 'Pagar.me') ON CONFLICT DO NOTHING;

-- 2. USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT REFERENCES public.billing_providers(id),
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    provider_price_id TEXT,
    plan_id TEXT NOT NULL, -- 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'
    status TEXT NOT NULL DEFAULT 'TRIAL', -- 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SUBSCRIPTION ITEMS (Usage based billing limits)
CREATE TABLE IF NOT EXISTS public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL, -- 'creatives_generated', 'videos_rendered'
    quota_limit INTEGER, -- NULL = Ilimitado
    current_usage INTEGER NOT NULL DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(subscription_id, resource_type)
);

-- 4. PAYMENT METHODS
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT REFERENCES public.billing_providers(id),
    provider_payment_method_id TEXT NOT NULL,
    brand TEXT, -- 'visa', 'mastercard'
    last4 TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BILLING EVENTS (Invoices & Receipts)
CREATE TABLE IF NOT EXISTS public.billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    provider TEXT REFERENCES public.billing_providers(id),
    provider_invoice_id TEXT,
    amount INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL, -- 'PAID', 'OPEN', 'FAILED'
    billing_reason TEXT,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BILLING RLS
ALTER TABLE public.billing_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
    ON public.billing_providers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Org members can view their subscriptions"
    ON public.user_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_members.organization_id = user_subscriptions.organization_id 
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Org members can view their subscription usage"
    ON public.subscription_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_subscriptions us
            JOIN public.organization_members om ON om.organization_id = us.organization_id
            WHERE us.id = subscription_items.subscription_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Org members can view their invoices"
    ON public.billing_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_members.organization_id = billing_events.organization_id 
            AND organization_members.user_id = auth.uid()
        )
    );
