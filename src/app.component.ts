
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';

export interface Analysis {
  signal: 'COMPRA' | 'VENDA' | 'AGUARDAR' | 'ERRO';
  time: string;
  reason: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [], // No separate styles file, using Tailwind in HTML
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  uploadedImage = signal<string | null>(null);
  analysisResult = signal<Analysis | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  isDragging = signal<boolean>(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File) {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImage.set(e.target.result);
        this.analysisResult.set(null);
        this.error.set(null);
      };
      reader.readAsDataURL(file);
    } else {
      this.error.set('Por favor, selecione um arquivo de imagem válido.');
    }
  }
  
  clearImage() {
    this.uploadedImage.set(null);
    this.analysisResult.set(null);
    this.error.set(null);
  }

  async analyzeImage() {
    const image = this.uploadedImage();
    if (!image) return;

    this.isLoading.set(true);
    this.analysisResult.set(null);
    this.error.set(null);

    try {
      const resultText = await this.geminiService.analyzeChart(image);
      const parsedResult = this.parseAnalysis(resultText);
      this.analysisResult.set(parsedResult);
      if (parsedResult.signal === 'COMPRA' || parsedResult.signal === 'VENDA') {
        this.speak(`Atenção! Sinal identificado. ${parsedResult.signal}`);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Ocorreu um erro desconhecido durante a análise.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private parseAnalysis(text: string): Analysis {
    const signalMatch = text.match(/SINAL:\s*(COMPRA|VENDA|AGUARDAR)/i);
    const timeMatch = text.match(/HORÁRIO:\s*(.*)/i);
    const reasonMatch = text.match(/MOTIVO:\s*([\s\S]*)/i);

    return {
      signal: signalMatch ? (signalMatch[1].toUpperCase() as any) : 'ERRO',
      time: timeMatch ? timeMatch[1].trim() : 'N/A',
      reason: reasonMatch ? reasonMatch[1].trim() : 'Não foi possível extrair o motivo da análise. Resposta completa: ' + text,
    };
  }
  
  private speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech não é suportado neste navegador.');
    }
  }

  getSignalClasses(signal: string) {
    switch (signal) {
      case 'COMPRA':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'VENDA':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'AGUARDAR':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  }
}
