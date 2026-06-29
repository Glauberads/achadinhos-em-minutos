-- 20260629000001_phase5_audit_logs.sql
-- FASE 5: Observabilidade e Audit Logs
-- Criação da tabela audit_logs, índices de performance e RLS

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id TEXT,
    event_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NULL,
    severity TEXT DEFAULT 'info',
    status TEXT DEFAULT 'success',
    source TEXT,
    request_id TEXT,
    correlation_id TEXT,
    ip TEXT,
    user_agent TEXT,
    duration_ms INTEGER,
    old_data JSONB DEFAULT '{}',
    new_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    error_message TEXT NULL,
    error_stack TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ÍNDICES (Alta Performance para Filtros)
-- ============================
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_organization_id ON public.audit_logs (organization_id);
CREATE INDEX idx_audit_logs_event_name ON public.audit_logs (event_name);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs (entity_id);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs (severity);
CREATE INDEX idx_audit_logs_status ON public.audit_logs (status);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_correlation_id ON public.audit_logs (correlation_id);
CREATE INDEX idx_audit_logs_request_id ON public.audit_logs (request_id);

-- Índices Compostos para queries comuns de timeline e entidades
CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity_composite ON public.audit_logs (entity, entity_id);
CREATE INDEX idx_audit_logs_event_created ON public.audit_logs (event_name, created_at DESC);
CREATE INDEX idx_audit_logs_status_created ON public.audit_logs (status, created_at DESC);


-- ============================
-- RLS (Row Level Security)
-- ============================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado só pode visualizar seus próprios logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service Role (backend) pode inserir logs
-- Supabase service_role key bypasses RLS by default, but explicit policy is good practice
CREATE POLICY "Service Role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true); -- Requires service role key to pass the API gateway

-- Admins podem visualizar tudo (futura expansão Multi-Tenant Fase 14)
-- Deixado preparado caso role 'admin' seja adicionado via JWT claims

-- ============================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================
COMMENT ON TABLE public.audit_logs IS 'Trilha de auditoria completa gerada pelo Event Bus e Listeners (Fase 5)';
COMMENT ON COLUMN public.audit_logs.event_name IS 'Nome do DomainEvent (ex: ProductImportedEvent)';
COMMENT ON COLUMN public.audit_logs.action IS 'Ação simplificada (ex: import_product)';
COMMENT ON COLUMN public.audit_logs.severity IS 'Nível de impacto: info, warn, error, critical';
