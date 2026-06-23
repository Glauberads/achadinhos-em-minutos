import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase';
import { ShopeeProvider, MercadoLivreProvider, SearchFilters, NormalizedProduct } from '../providers/products';

export async function productRoutes(fastify: FastifyInstance) {
  
  // Rota de Busca de Produtos (Preview)
  fastify.post('/search', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.code(401).send({ error: 'Missing token' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    const { platform, keyword, category, limit } = request.body as any;

    if (!platform || !['shopee', 'mercadolivre'].includes(platform)) {
      return reply.code(400).send({ error: 'Platform must be shopee or mercadolivre' });
    }

    // 1. Criar Job de Busca com status pending
    const { data: job, error: jobError } = await supabaseAdmin
      .from('product_search_jobs')
      .insert({
        user_id: user.id,
        platform: platform,
        keyword: keyword,
        category: category,
        status: 'running',
        filters: request.body
      })
      .select()
      .single();

    if (jobError) {
      request.log.error(jobError);
      return reply.code(500).send({ error: 'Failed to create search job' });
    }

    try {
      // 2. Chamar o provider correspondente
      const provider = platform === 'shopee' ? new ShopeeProvider() : new MercadoLivreProvider();
      
      const filters: SearchFilters = { keyword, category, limit: limit || 10 };
      const products = await provider.search(filters, user.id);

      // 3. Atualizar Job com sucesso
      await supabaseAdmin
        .from('product_search_jobs')
        .update({
          status: 'completed',
          total_found: products.length,
          finished_at: new Date().toISOString()
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
          finished_at: new Date().toISOString()
        })
        .eq('id', job.id);
        
      return reply.code(500).send({ error: 'Search failed', details: err.message });
    }
  });

  // Rota de Importação Segura
  fastify.post('/import', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.code(401).send({ error: 'Missing token' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    const { products, job_id } = request.body as { products: NormalizedProduct[], job_id?: string };

    if (!products || !Array.isArray(products) || products.length === 0) {
      return reply.code(400).send({ error: 'No products to import' });
    }

    let importedCount = 0;
    let ignoredCount = 0;

    for (const prod of products) {
      // Tratar affiliate_link vazio
      if (!prod.affiliate_link) {
        prod.metadata.affiliate_status = 'missing';
      }

      // Validar user_id: IGNORA o do frontend e usa o do token autenticado
      const productToInsert = {
        ...prod,
        user_id: user.id, // SEMPRE usa o user.id do token
      };

      // Tenta inserir via Supabase
      // O ON CONFLICT não é facilmente suportado no SDK js padrão para indexes parciais complexos sem RPC
      // Vamos fazer um check manual rápido para não complicar, ou tentar o insert e capturar o erro.
      
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', prod.platform)
        .eq('external_id', prod.external_id)
        .single();

      if (existing) {
        ignoredCount++;
        continue;
      }

      const { error: insertError } = await supabaseAdmin
        .from('products')
        .insert(productToInsert);

      if (insertError) {
        request.log.error(insertError);
        ignoredCount++;
      } else {
        importedCount++;
      }
    }

    // Atualiza o job se ele existir
    if (job_id) {
      await supabaseAdmin
        .from('product_search_jobs')
        .update({ total_imported: importedCount })
        .eq('id', job_id);
    }

    // Registrar log no sistema
    await supabaseAdmin.from('system_logs').insert({
      user_id: user.id,
      action: 'products_imported',
      message: `${importedCount} produtos importados com sucesso. ${ignoredCount} ignorados (duplicados ou falha).`,
      metadata: { imported: importedCount, ignored: ignoredCount }
    });

    return { success: true, imported: importedCount, ignored: ignoredCount };
  });

}
