import { FastifyInstance } from 'fastify';
import { requireAuth, getClientIp, getUserAgent } from '../middleware/auth.middleware';
import { productRepository } from '../repositories';
import { auditService } from '../services';
import { supabaseAdmin } from '../lib/supabase';
import { ShopeeProvider, MercadoLivreProvider, SearchFilters } from '../providers/products';
import { validateBody, productSearchSchema, productImportSchema } from '../validators';

/**
 * Rotas de Produtos — Refatoradas para usar:
 * - Middleware centralizado
 * - Validators Zod
 * - ProductRepository
 * - AuditService
 */
export async function productRoutes(fastify: FastifyInstance) {

  // ============================
  // 1. Busca de Produtos (Preview)
  // ============================
  fastify.post('/search', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const body = validateBody(productSearchSchema, request.body);

    // 1. Criar Job de Busca
    const { data: job, error: jobError } = await supabaseAdmin
      .from('product_search_jobs')
      .insert({
        user_id: user.id,
        platform: body.platform,
        keyword: body.keyword,
        category: body.category,
        status: 'running',
        filters: body,
      })
      .select()
      .single();

    if (jobError) {
      request.log.error(jobError);
      return reply.code(500).send({ error: 'Failed to create search job' });
    }

    try {
      // 2. Chamar o provider correspondente
      const provider = body.platform === 'shopee'
        ? new ShopeeProvider()
        : new MercadoLivreProvider();

      const filters: SearchFilters = {
        keyword: body.keyword,
        category: body.category,
        limit: body.limit,
      };
      const products = await provider.search(filters, user.id);

      // 3. Atualizar Job com sucesso
      await supabaseAdmin
        .from('product_search_jobs')
        .update({
          status: 'completed',
          total_found: products.length,
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return { job_id: job.id, products };

    } catch (err: any) {
      // Falha no Job
      await supabaseAdmin
        .from('product_search_jobs')
        .update({
          status: 'failed',
          error_message: err.message || 'Unknown error',
          finished_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return reply.code(500).send({ error: 'Search failed', details: err.message });
    }
  });

  // ============================
  // 2. Importação Segura
  // ============================
  fastify.post('/import', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user;
    const body = validateBody(productImportSchema, request.body);

    let importedCount = 0;
    let ignoredCount = 0;

    for (const prod of body.products) {
      // Marcar affiliate_status se link ausente
      const metadata = { ...(prod.metadata || {}) };
      if (!prod.affiliate_link) {
        metadata.affiliate_status = 'missing';
      }

      // Verificar duplicidade via Repository
      const existing = await productRepository.findDuplicate(user.id, prod.platform, prod.external_id);
      if (existing) {
        ignoredCount++;
        continue;
      }

      // Inserir via Repository (força user_id do token)
      const { error: insertError } = await productRepository.insert(
        { ...prod, metadata },
        user.id,
      );

      if (insertError) {
        request.log.error(insertError);
        ignoredCount++;
      } else {
        importedCount++;
      }
    }

    // Atualiza o job se existir
    if (body.job_id) {
      await supabaseAdmin
        .from('product_search_jobs')
        .update({ total_imported: importedCount })
        .eq('id', body.job_id);
    }

    // Auditoria centralizada
    await auditService.log({
      userId: user.id,
      action: 'products_imported',
      entity: 'products',
      message: `${importedCount} produtos importados com sucesso. ${ignoredCount} ignorados (duplicados ou falha).`,
      metadata: { imported: importedCount, ignored: ignoredCount },
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return { success: true, imported: importedCount, ignored: ignoredCount };
  });
}
