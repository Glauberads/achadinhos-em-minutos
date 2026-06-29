import crypto from 'crypto';

/**
 * CacheKeys — Gerenciador centralizado de chaves de Redis (Fase 9).
 * Previne uso de strings mágicas espalhadas pelo código.
 */
export const CacheKeys = {
  
  marketplace: {
    search: (provider: string, userId: string, filters: any): string => {
      const hash = generateQueryHash(filters);
      return `marketplace:${provider}:search:${userId}:${hash}`;
    },
    categories: (provider: string): string => {
      return `marketplace:${provider}:categories`;
    }
  },

  dashboard: {
    metrics: (userId: string, range: string): string => {
      return `dashboard:metrics:${userId}:${range}`;
    }
  },

  campaign: {
    summary: (userId: string, campaignId: string): string => {
      return `campaign:summary:${userId}:${campaignId}`;
    }
  },

  system: {
    featureFlags: (userId: string): string => {
      return `feature-flags:${userId}`;
    },
    workerHealth: (workerName: string): string => {
      return `worker:health:${workerName}`;
    }
  }
};

/**
 * Utilitário para gerar um hash estável e determinístico a partir de um objeto de filtros.
 */
function generateQueryHash(queryObj: Record<string, any>): string {
  if (!queryObj) return 'empty';
  
  // Normalizar e ordenar as chaves para garantir que {a:1,b:2} == {b:2,a:1}
  const sortedKeys = Object.keys(queryObj).sort();
  const normalizedObj: Record<string, any> = {};
  
  for (const key of sortedKeys) {
    if (queryObj[key] !== undefined && queryObj[key] !== null) {
      normalizedObj[key] = queryObj[key];
    }
  }

  const str = JSON.stringify(normalizedObj);
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 8); // 8 chars md5 hash
}
