-- 20260629000003_phase6_dashboard_rpc.sql
-- FASE 6: Dashboard Executivo
-- Função RPC para consolidar métricas e gráficos em uma única chamada.

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    v_kpis JSONB;
    v_charts JSONB;
    v_timeline JSONB;
BEGIN

    -- 1. KPIs
    SELECT jsonb_build_object(
        'campaigns_active', COALESCE(COUNT(NULLIF(status != 'active', true)), 0),
        'campaigns_paused', COALESCE(COUNT(NULLIF(status != 'paused', true)), 0),
        'campaigns_finished', COALESCE(COUNT(NULLIF(status != 'completed', true)), 0)
    ) INTO v_kpis
    FROM public.campaigns
    WHERE user_id = p_user_id;

    -- KPIs de Posts Agendados (Produtos e Mensagens)
    DECLARE
        v_sent INT;
        v_pending INT;
        v_failed INT;
        v_total_posts INT;
        v_avg_time FLOAT;
    BEGIN
        SELECT 
            COUNT(*) FILTER (WHERE status = 'sent'),
            COUNT(*) FILTER (WHERE status = 'pending' OR status = 'queued'),
            COUNT(*) FILTER (WHERE status = 'failed'),
            COUNT(*),
            EXTRACT(EPOCH FROM AVG(sent_at - queued_at)) * 1000
        INTO v_sent, v_pending, v_failed, v_total_posts, v_avg_time
        FROM public.scheduled_posts
        WHERE user_id = p_user_id;

        v_kpis := v_kpis || jsonb_build_object(
            'products_sent', COALESCE(v_sent, 0),
            'messages_sent', COALESCE(v_sent, 0),
            'products_pending', COALESCE(v_pending, 0),
            'products_failed', COALESCE(v_failed, 0),
            'delivery_rate', CASE WHEN (v_sent + v_failed) > 0 THEN ROUND((v_sent::numeric / (v_sent + v_failed)::numeric) * 100, 1) ELSE 0 END,
            'avg_send_time_ms', COALESCE(ROUND(v_avg_time::numeric), 0)
        );
    END;

    -- Total de produtos importados (Na fase 2 existia a tabela products)
    DECLARE
        v_imported INT;
    BEGIN
        SELECT COUNT(*) INTO v_imported FROM public.products WHERE user_id = p_user_id;
        v_kpis := v_kpis || jsonb_build_object('products_imported', COALESCE(v_imported, 0));
    END;

    -- KPIs de Auditoria/Eventos
    DECLARE
        v_logs INT;
    BEGIN
        SELECT COUNT(*) INTO v_logs FROM public.audit_logs WHERE user_id = p_user_id;
        v_kpis := v_kpis || jsonb_build_object('total_events', COALESCE(v_logs, 0), 'total_logs', COALESCE(v_logs, 0));
    END;

    -- 2. CHARTS (Gráficos)
    DECLARE
        v_sends_by_day JSONB;
        v_imports_by_day JSONB;
        v_products_by_marketplace JSONB;
        v_products_by_category JSONB;
        v_campaign_status JSONB;
    BEGIN
        -- Envios por dia (Últimos 7 dias)
        SELECT COALESCE(jsonb_agg(jsonb_build_object('date', date_trunc('day', created_at)::date, 'count', count)), '[]'::jsonb)
        INTO v_sends_by_day
        FROM (
            SELECT created_at, COUNT(*) as count 
            FROM public.scheduled_posts 
            WHERE user_id = p_user_id AND status = 'sent' AND created_at >= NOW() - INTERVAL '7 days'
            GROUP BY date_trunc('day', created_at)
            ORDER BY date_trunc('day', created_at) ASC
        ) t;

        -- Importações por dia (Últimos 7 dias)
        SELECT COALESCE(jsonb_agg(jsonb_build_object('date', date_trunc('day', created_at)::date, 'count', count)), '[]'::jsonb)
        INTO v_imports_by_day
        FROM (
            SELECT created_at, COUNT(*) as count 
            FROM public.products 
            WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '7 days'
            GROUP BY date_trunc('day', created_at)
            ORDER BY date_trunc('day', created_at) ASC
        ) t;

        -- Produtos por Marketplace
        SELECT COALESCE(jsonb_agg(jsonb_build_object('platform', platform, 'count', count)), '[]'::jsonb)
        INTO v_products_by_marketplace
        FROM (
            SELECT platform, COUNT(*) as count FROM public.products WHERE user_id = p_user_id GROUP BY platform
        ) t;

        -- Produtos por Categoria (Top 5)
        SELECT COALESCE(jsonb_agg(jsonb_build_object('category', category, 'count', count)), '[]'::jsonb)
        INTO v_products_by_category
        FROM (
            SELECT category, COUNT(*) as count FROM public.products WHERE user_id = p_user_id GROUP BY category ORDER BY count DESC LIMIT 5
        ) t;

        -- Status das campanhas
        SELECT COALESCE(jsonb_agg(jsonb_build_object('name', status, 'value', count)), '[]'::jsonb)
        INTO v_campaign_status
        FROM (
            SELECT status, COUNT(*) as count FROM public.campaigns WHERE user_id = p_user_id GROUP BY status
        ) t;

        v_charts := jsonb_build_object(
            'sends_by_day', v_sends_by_day,
            'imports_by_day', v_imports_by_day,
            'products_by_marketplace', v_products_by_marketplace,
            'products_by_category', v_products_by_category,
            'campaign_status', v_campaign_status
        );
    END;

    -- 3. TIMELINE (Últimas 10 atividades)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'event_name', event_name,
            'severity', severity,
            'created_at', created_at
        )
    ), '[]'::jsonb)
    INTO v_timeline
    FROM (
        SELECT id, event_name, severity, created_at 
        FROM public.audit_logs 
        WHERE user_id = p_user_id 
        ORDER BY created_at DESC 
        LIMIT 10
    ) t;

    -- 4. CONSOLIDAÇÃO
    result := jsonb_build_object(
        'kpis', v_kpis,
        'charts', v_charts,
        'timeline', v_timeline
    );

    RETURN result;
END;
$$;
