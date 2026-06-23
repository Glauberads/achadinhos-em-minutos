import dotenv from 'dotenv';
dotenv.config();

import './campaign-runner';
import './telegram-sender';

console.log('[Workers] Processo de Workers iniciado com sucesso. Aguardando jobs...');
