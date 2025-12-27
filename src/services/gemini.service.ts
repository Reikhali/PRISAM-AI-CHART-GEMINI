
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
Você é o MOTOR PRISMA IA, um analista de alta precisão para Opções Binárias em M1.
SUA MISSÃO: Analisar o gráfico e prever a próxima vela com base em padrões técnicos.

REGRAS TÉCNICAS OBRIGATÓRIAS:
1.  **PRIORIDADE PAVIO (REVERSÃO):** Se a vela tocar uma zona de suporte/resistência e deixar um pavio longo (mais de 50% do corpo) contra o movimento, é um forte sinal de REVERSÃO.
2.  **VELA DE DESCANSO (CONTINUIDADE):** Se, após um rompimento, surgir uma vela pequena com corpo e sem pavio significativo contra a tendência, confirme a CONTINUIDADE.
3.  **FILTRO DE EXAUSTÃO:** Uma vela gigante e isolada indica exaustão. NÃO OPERAR (AGUARDAR).
4.  **OCR OBRIGATÓRIO:** Identifique o par de moedas (ATIVO) no canto da tela.

SAÍDA FORMATADA (OBRIGATÓRIO E SEMPRE NESTE FORMATO):
ATIVO: [Nome do Ativo] | SINAL: [COMPRA/VENDA/AGUARDAR] | ASSERTIVIDADE: [0-100%] | MOTIVO: [Explicação técnica curta]
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
      text: "Analise o frame atual. O mercado está favorável para a próxima vela?",
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
      text: "Analise o frame atual. O mercado está favorável para a próxima vela?"
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
