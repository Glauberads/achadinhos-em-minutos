-- ==============================================================================
-- MIGRATION: Go Live Enterprise - Workspaces & Organizations
-- ==============================================================================

-- 1. TABELAS DE ORGANIZAÇÃO
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_settings (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    branding_color TEXT DEFAULT '#6366f1',
    logo_url TEXT,
    billing_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.organization_roles(id),
    is_owner BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);

-- 2. ATUALIZAR TABELAS CORE PARA SUPORTAR ORGANIZATIONS
-- Nota: Inicialmente nullable para evitar quebrar dados antigos, 
-- depois um script em background deve preencher orgs para users antigos.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.creative_feedbacks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. RLS PARA ORGANIZAÇÕES E MEMBROS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organizations"
    ON public.organizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_members.organization_id = organizations.id 
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view members of their organizations"
    ON public.organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members as om
            WHERE om.organization_id = organization_members.organization_id 
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage organization settings"
    ON public.organization_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_members.organization_id = organization_settings.organization_id 
            AND organization_members.user_id = auth.uid()
            AND organization_members.is_owner = true
        )
    );

-- 4. FUNCTION PARA CRIAR ORG AUTOMATICAMENTE NO CADASTRO
CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    default_role_id UUID;
BEGIN
    -- Cria uma organização padrão para o usuário
    INSERT INTO public.organizations (name, slug)
    VALUES (NEW.email || '''s Workspace', 'org-' || substr(md5(random()::text), 0, 10))
    RETURNING id INTO new_org_id;

    -- Cria settings vazios
    INSERT INTO public.organization_settings (organization_id, billing_email)
    VALUES (new_org_id, NEW.email);

    -- Adiciona o usuário como owner
    INSERT INTO public.organization_members (organization_id, user_id, is_owner)
    VALUES (new_org_id, NEW.id, true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dispara logo após criar o profile base
DROP TRIGGER IF EXISTS on_auth_user_created_org ON public.profiles;
CREATE TRIGGER on_auth_user_created_org
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_org();
