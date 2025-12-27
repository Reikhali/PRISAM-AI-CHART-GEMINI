
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
Você é o PRISMA IA, o motor de inteligência avançada para Opções Binárias em M1.
SUA MISSÃO: Analisar o fluxo de vídeo/frames em tempo real e identificar padrões de alta assertividade.

REGRAS DE ANÁLISE:
1. IDENTIFICAÇÃO (OCR): Identifique o Ativo (ex: EUR/USD) e o Horário no topo da tela.
2. PADRÃO VELA DE DESCANSO: Vela pequena, sem pavio contra a tendência após rompimento = CONTINUIDADE.
3. PADRÃO REJEIÇÃO: Vela toca zona de suporte/resistência e deixa pavio longo (mais de 50% do corpo) = REVERSÃO.
4. FILTRO DE EXAUSTÃO: Vela gigante isolada = NÃO OPERAR (AGUARDAR).

RESPOSTA OBRIGATÓRIA (CURTA PARA VOZ):
ATIVO: [Nome] | SINAL: [COMPRA/VENDA/AGUARDAR] | ASSERTIVIDADE: [0-100%] | MOTIVO: [Breve]
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
        mimeType: 'image/png',
        data: base64Data,
      },
    };

    const textPart = {
      text: "PRISMA IA: Analise este frame agora. Dê o sinal para a próxima vela de M1.",
    };

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: this.SYSTEM_PROMPT,
          temperature: 0.2, 
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
      text: "PRISMA IA: Analise este frame agora. Dê o sinal para a próxima vela de M1."
    };

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: this.SYSTEM_PROMPT,
          temperature: 0.1,
        },
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API for live frame:', error);
      throw new Error('Failed to get live analysis from AI.');
    }
  }
}
