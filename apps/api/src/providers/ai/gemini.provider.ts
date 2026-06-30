import { AIProvider } from './ai.provider.interface';

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  async generateContent(prompt: string, options?: { jsonMode?: boolean }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (options?.jsonMode) {
      payload.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json() as any;
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }
}
