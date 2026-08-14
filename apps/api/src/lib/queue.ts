import { Queue } from 'bullmq';
import { bullMQConnection } from './redis';

// Fila para rodar campanhas (buscar produtos)
export const campaignQueue = new Queue('campaign-runner', {
  connection: bullMQConnection
});

// Fila para enviar posts pro Telegram
export const telegramQueue = new Queue('telegram-send', {
  connection: bullMQConnection
});
