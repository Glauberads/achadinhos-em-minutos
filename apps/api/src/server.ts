import Fastify from 'fastify';
import { telegramRoutes } from './routes/telegram';
import { productRoutes } from './routes/products';
import { marketplaceRoutes } from './routes/marketplaces';
import { campaignRoutes } from './routes/campaigns';

const server = Fastify({
  logger: true
});

// Tratamento de CORS básico
server.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*'); // Para o MVP. Em prod, restringir para a url da Vercel.
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (request.method === 'OPTIONS') {
    reply.status(200).send();
    return;
  }
  done();
});

server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Registrar rotas
server.register(telegramRoutes, { prefix: '/api/telegram' });
server.register(productRoutes, { prefix: '/api/products' });
server.register(marketplaceRoutes, { prefix: '/api/marketplaces' });
server.register(campaignRoutes, { prefix: '/api/campaigns' });

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
