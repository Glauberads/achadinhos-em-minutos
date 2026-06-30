export interface AIProvider {
  /**
   * Envia um prompt para a IA e retorna a resposta formatada ou crua.
   */
  generateContent(prompt: string, options?: { jsonMode?: boolean }): Promise<string>;
}
