import { supabaseAdmin } from '../lib/supabase';
import { connectionRepository } from '../repositories';

/**
 * TelegramService — Centraliza lógica de construção de mensagem e envio.
 * 
 * Elimina duplicação entre:
 * - routes/telegram.ts (test-send)
 * - workers/telegram-sender.ts (envio automático)
 * 
 * Ambos agora chamam este service.
 */
export class TelegramService {

  /**
   * Constrói a mensagem formatada para o Telegram a partir de um produto.
   * 
   * @param product - Dados do produto
   * @param isAutomatic - Se true, indica envio automático (muda header)
   */
  buildOfferMessage(product: any, isAutomatic = false): string {
    const truncTitle = product.title.length > 80
      ? product.title.substring(0, 80) + '...'
      : product.title;

    const header = isAutomatic ? '🔥 *Achadinho Automático*' : '🔥 *Achadinho em Minutos*';

    let caption = `${header}\n\n`;
    caption += `${truncTitle}\n\n`;

    if (product.original_price > product.current_price) {
      caption += `De: R$ ${product.original_price}\n`;
    }
    caption += `Por: *R$ ${product.current_price}*\n`;

    if (product.discount) {
      caption += `Desconto: ${product.discount}%\n\n`;
    } else {
      caption += `\n`;
    }

    // Selos de confiança
    if (product.sold_count > 100) {
      caption += `✅ Mais de ${product.sold_count} vendidos\n`;
    } else {
      caption += `✅ Produto em alta\n`;
    }

    if (product.free_shipping) {
      caption += `✅ Frete grátis garantido\n`;
    }
    caption += `✅ Link seguro de parceiro\n\n`;

    const link = product.affiliate_link || product.source_url;
    caption += `👉 *COMPRE COM DESCONTO:*\n[Acessar Oferta Aqui](${link})`;

    return caption;
  }

  /**
   * Envia mensagem para o Telegram via Bot API.
   * Decide automaticamente entre sendPhoto e sendMessage.
   */
  async sendMessage(params: {
    botToken: string;
    chatId: string;
    caption: string;
    imageUrl?: string | null;
  }): Promise<{ ok: boolean; description?: string }> {
    const { botToken, chatId, caption, imageUrl } = params;

    let endpoint = 'sendMessage';
    const payload: any = {
      chat_id: chatId,
      parse_mode: 'Markdown',
    };

    if (imageUrl) {
      endpoint = 'sendPhoto';
      payload.photo = imageUrl;
      payload.caption = caption;
    } else {
      payload.text = caption;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    return (await response.json()) as any;
  }

  /**
   * Valida um token de bot consultando a Telegram API.
   */
  async validateBotToken(botToken: string): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data: any = await response.json();

      if (!data.ok) {
        return { valid: false, error: data.description };
      }

      return { valid: true, username: data.result.username };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Busca o token do bot de um usuário.
   * Retorna null se não encontrado (seguro, nunca expõe ao frontend).
   */
  async getBotToken(userId: string): Promise<string | null> {
    const { data: conn } = await connectionRepository.findConnectedByPlatform(userId, 'telegram');

    if (!conn || !conn.access_token) return null;
    return conn.access_token;
  }

  /**
   * Registra resultado de envio no send_logs.
   */
  async logSendResult(params: {
    userId: string;
    productId: string;
    groupId: string;
    status: 'success' | 'failed';
    errorMessage?: string | null;
  }): Promise<void> {
    await supabaseAdmin.from('send_logs').insert({
      user_id: params.userId,
      product_id: params.productId,
      group_id: params.groupId,
      status: params.status,
      error_message: params.errorMessage || null,
    });
  }
}

export const telegramService = new TelegramService();
