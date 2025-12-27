
import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { HistoryPanelComponent, HistoryItem } from './history-panel.component';

export interface Analysis {
  signal: 'COMPRA' | 'VENDA' | 'AGUARDAR' | 'ERRO';
  time: string;
  reason: string;
  asset?: string;
  assertividade?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [], // No separate styles file, using Tailwind in HTML
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, HistoryPanelComponent],
})
export class AppComponent implements OnDestroy {
  private geminiService = inject(GeminiService);

  // Common state
  analysisResult = signal<Analysis | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Mode selection
  mode = signal<'upload' | 'live'>('upload');

  // Upload mode state
  uploadedImage = signal<string | null>(null);
  isDragging = signal<boolean>(false);

  // Live mode state
  isCapturing = signal(false);
  isSynced = signal(false);
  countdown = signal(60);
  private videoStream: MediaStream | null = null;
  private countdownIntervalId: any = null;
  
  // History state
  history = signal<HistoryItem[]>([]);

  // Element Refs
  videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvasElement');
  
  ngOnDestroy() {
    this.stopCapture();
  }
  
  setMode(newMode: 'upload' | 'live') {
    if (this.mode() === newMode) return;
    this.stopCapture(); // Stop any live processes before switching
    this.mode.set(newMode);
  }

  // --- Live Analysis Methods ---

  async connectToChart() {
    this.error.set(null);
    try {
      if (this.videoStream) {
        this.stopVideoStream();
      }
      this.videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = this.videoElement()?.nativeElement;
      if (video) {
        video.srcObject = this.videoStream;
        await video.play();
      }
      this.isCapturing.set(true);
      this.speak("Sensor Visual Prisma Conectado. Sincronize o timer.");
    } catch (err: any) {
      this.error.set('Não foi possível capturar a tela. Verifique as permissões do navegador.');
      this.mode.set('upload');
    }
  }

  private stopVideoStream() {
    this.videoStream?.getTracks().forEach(track => track.stop());
    this.videoStream = null;
    const video = this.videoElement()?.nativeElement;
    if(video) video.srcObject = null;
  }

  stopCapture() {
    this.stopVideoStream();
    this.isCapturing.set(false);
    this.isSynced.set(false);
    this.countdown.set(60);
    this.analysisResult.set(null);
    this.error.set(null);
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
  }

  disconnect() {
    this.stopCapture();
    this.speak("Sistema desconectado.");
  }
  
  syncTimer() {
    this.isSynced.set(true);
    this.countdown.set(60);
    this.speak("Timer sincronizado.");

    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }

    this.countdownIntervalId = setInterval(() => {
      this.countdown.update(c => {
        const newCount = c - 1;
        if (newCount === 2 && !this.isLoading()) {
           this.speak("Analisando fechamento.");
           this.forceScan(); 
        }
        return newCount > 0 ? newCount : 60; // Reset for next minute
      });
    }, 1000);
  }

  async forceScan() {
    const video = this.videoElement()?.nativeElement;
    const canvas = this.canvasElement()?.nativeElement;
    if (!video || !canvas || video.readyState < 2 || this.isLoading()) return;

    this.isLoading.set(true);
    
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.isLoading.set(false);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const resultText = await this.geminiService.analyzeLiveFrame(imageDataUrl);
      const parsedResult = this.parseLiveAnalysis(resultText);
      this.analysisResult.set(parsedResult);
      if (parsedResult.signal === 'COMPRA' || parsedResult.signal === 'VENDA') {
        this.addToHistory(parsedResult);
        this.speak(`Sinal Prisma Live. ${parsedResult.signal}. ${parsedResult.reason}`);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Ocorreu um erro na análise ao vivo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private parseLiveAnalysis(text: string): Analysis {
    const signalMatch = text.match(/SINAL:\s*(COMPRA|VENDA|AGUARDAR)/i);
    const reasonMatch = text.match(/MOTIVO:\s*([\s\S]*)/i);
    const assetMatch = text.match(/ATIVO:\s*(.*)/i);

    let signal: Analysis['signal'] = 'AGUARDAR';
    if (signalMatch) {
      signal = signalMatch[1].toUpperCase() as any;
    } else if (text.toUpperCase().includes('COMPRA')) {
      signal = 'COMPRA';
    } else if (text.toUpperCase().includes('VENDA')) {
      signal = 'VENDA';
    }

    return {
      signal: signal,
      time: new Date().toLocaleTimeString('pt-BR'),
      reason: reasonMatch ? reasonMatch[1].trim() : text,
      asset: assetMatch ? assetMatch[1].trim() : '---',
    };
  }

  // --- Image Upload Methods ---

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
        this.addToHistory(parsedResult);
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
    const reasonMatch = text.match(/MOTIVO:\s*([\s\S]*)/i);
    const assetMatch = text.match(/ATIVO:\s*(.*)/i);
    const assertMatch = text.match(/ASSERTIVIDADE:\s*(.*)/i);

    return {
      signal: signalMatch ? (signalMatch[1].toUpperCase() as any) : 'ERRO',
      time: new Date().toLocaleTimeString('pt-BR'),
      reason: reasonMatch ? reasonMatch[1].trim() : 'Não foi possível extrair o motivo da análise. Resposta completa: ' + text,
      asset: assetMatch ? assetMatch[1].trim() : '---',
      assertividade: assertMatch ? assertMatch[1].trim() : '--%',
    };
  }
  
  private speak(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech não é suportado neste navegador.');
    }
  }
  
  // --- History Methods ---
  private addToHistory(analysis: Analysis) {
    if (analysis.signal !== 'COMPRA' && analysis.signal !== 'VENDA') return;

    const newItem: HistoryItem = {
      id: Date.now(),
      time: analysis.time,
      asset: analysis.asset || '---',
      direction: analysis.signal,
      result: 'PENDENTE'
    };

    this.history.update(current => [newItem, ...current].slice(0, 5));
  }

  markAsWin(id: number) {
    this.history.update(current => 
      current.map(item => item.id === id ? { ...item, result: 'WIN' } : item)
    );
  }

  markAsLoss(id: number) {
    this.history.update(current => 
      current.map(item => item.id === id ? { ...item, result: 'LOSS' } : item)
    );
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
