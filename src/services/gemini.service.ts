
import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// This is a placeholder for the environment variable.
// In a real Applet environment, this would be configured securely.
declare const process: any; 

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;
  private readonly SYSTEM_PROMPT = `
-Você é o MOTOR PRISMA IA. Sua análise é focada em escalpelamento (scalping) de M1.
TAREFAS OBRIGATÓRIAS:
1. OCR DE ATIVO: Identifique o par de moedas e o timeframe no topo da imagem.
2. ANÁLISE DE PAVIO: Se a vela atual deixou pavio de rejeição em zona de suporte/resistência, priorize a reversão.
3. VELA DE DESCANSO: Identifique velas pequenas sem pavios longos a favor da tendência para continuação.
4. FILTRO DE EXAUSTÃO: Se a vela for 3x maior que a média, preveja retração.

RESPOSTA PADRÃO:
SINAL: [COMPRA / VENDA / AGUARDAR]
ATIVO: [Nome do Par detectado]
ASSERTIVIDADE: [X%]
MOTIVO: [Explicação técnica de 1 frase]
`;

  private readonly SYSTEM_PROMPT_LIVE = `
Você é o Prisma IA em modo LIVE. Sua análise é URGENTE e focada no MOMENTO ATUAL da vela.
Analise a imagem, que é um frame de um vídeo do gráfico.
Sua missão é detectar força ou exaustão no movimento da vela atual para prever a PRÓXIMA vela.
- Se a vela atual mostra FORÇA DE FLUXO (corpo grande, fechando perto da máxima/mínima), anuncie a continuação.
- Se a vela atual mostra EXAUSTÃO (pavio longo contra o movimento, corpo pequeno), anuncie a reversão.
- Se o movimento for fraco ou incerto, responda apenas: AGUARDAR.
RESPONDA DE FORMA DIRETA E RÁPIDA. Exemplo: "SINAL: COMPRA, MOTIVO: Força de fluxo de alta." ou "SINAL: VENDA, MOTIVO: Exaustão compradora com pavio superior."
`;

  constructor() {
    // IMPORTANT: The API key is sourced from environment variables for security.
    // Do not hardcode API keys in the application.
    if (typeof process === 'undefined' || !process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        // In a real app, you might want to handle this more gracefully.
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeChart(base64Image: string): Promise<string> {
    if (!base64Image) {
      throw new Error('Image data is required for analysis.');
    }

    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid base64 image format.');
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/png', // Assuming PNG, can be made dynamic
        data: base64Data,
      },
    };

    const textPart = {
      text: "Analise esta imagem. Há sinal para a próxima vela?",
    };

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: this.SYSTEM_PROMPT,
          temperature: 0.2, // Lower temperature for more deterministic analysis
        },
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get analysis from AI. Please check the console for details.');
    }
  }

  async analyzeLiveFrame(base64Image: string): Promise<string> {
    if (!base64Image) {
      throw new Error('Image data is required for analysis.');
    }
    
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid base64 image format.');
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    };

    const textPart = {
      text: "Analise este gráfico de M1 agora. Identifique o ATIVO (moeda), o HORÁRIO e dê o SINAL (COMPRA/VENDA/AGUARDAR). Use o protocolo de pavios e fluxo.",
    };

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: this.SYSTEM_PROMPT_LIVE,
          temperature: 0.1, // Even more deterministic for live mode
        },
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API for live frame:', error);
      throw new Error('Failed to get live analysis from AI.');
    }
  }
}
