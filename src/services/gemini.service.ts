
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
Você é o PRISMA IA, um especialista em Price Action e Fluxo de Vela para M1. Sua função é analisar frames de vídeo de gráficos de trading.

Foco Visual: Identifique pavios de rejeição (mínimo 50% da vela) e 'Velas de Descanso' (corpo pequeno após rompimento).

Leitura OCR: Localize o par de moedas e o relógio na imagem.

Protocolo de Voz: Suas respostas devem ser curtas para que o sintetizador de voz fale rápido. Formato de Resposta: 'SINAL: [COMPRA/VENDA/AGUARDAR] no [ATIVO]. MOTIVO: [Exaustão/Pavio/Fluxo]. Confiança: [X]%'
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
      text: "Analise este frame agora. Verifique a força do pavio e o fluxo. Dê o sinal para a próxima vela.",
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
      text: "Analise este frame agora. Verifique a força do pavio e o fluxo. Dê o sinal para a próxima vela."
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
