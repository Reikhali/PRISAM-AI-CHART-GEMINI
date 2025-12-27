
import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, viewChild, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { HistoryPanelComponent, HistoryItem } from './history-panel.component';
import { LoginComponent } from './login.component';

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
  standalone: true,
  imports: [CommonModule, HistoryPanelComponent, LoginComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  private geminiService = inject(GeminiService);

  analysisResult = signal<Analysis | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  mode = signal<'upload' | 'live'>('live');
  uploadedImage = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  isCapturing = signal(false);
  isSynced = signal(false);
  countdown = signal(60);
  history = signal<HistoryItem[]>([]);
  isAuthenticated = signal(false);

  private videoStream: MediaStream | null = null;
  private countdownIntervalId: any = null;

  videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvasElement');

  confidenceValue = computed(() => {
    const confidence = this.analysisResult()?.assertividade;
    if (!confidence) return 0;
    const numericValue = parseFloat(confidence.replace('%', ''));
    return isNaN(numericValue) ? 0 : numericValue;
  });

  constructor() {
    this.loadHistoryFromStorage();
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('prisma-auth') === 'true') {
      this.isAuthenticated.set(true);
    }
  }

  ngOnDestroy() {
    this.stopCapture();
  }

  handleLoginSuccess() {
    this.isAuthenticated.set(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('prisma-auth', 'true');
    }
  }

  logout() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('prisma-auth');
    }
    this.isAuthenticated.set(false);
    this.disconnect();
  }

  setMode(newMode: 'upload' | 'live') {
    if (this.mode() === newMode) return;
    this.stopCapture();
    this.mode.set(newMode);
  }

  async connectToChart() {
    try {
      this.videoStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { frameRate: 30 } 
      });
      const video = this.videoElement()?.nativeElement;
      if (video) {
        video.srcObject = this.videoStream;
        await video.play();
        this.isCapturing.set(true);
        this.speak("Sensor Prisma Conectado.");
      }
    } catch (err) {
      this.error.set("Permissão de tela negada.");
    }
  }

  stopCapture() {
    this.videoStream?.getTracks().forEach(t => t.stop());
    this.videoStream = null;
    this.isCapturing.set(false);
    this.isSynced.set(false);
    this.countdown.set(60);
    this.analysisResult.set(null);
    if (this.countdownIntervalId) {
        clearInterval(this.countdownIntervalId);
        this.countdownIntervalId = null;
    }
  }

  disconnect() {
    this.stopCapture();
    this.speak("Desconectado.");
  }

  syncTimer() {
    this.isSynced.set(true);
    this.countdown.set(60);
    this.speak("Timer sincronizado. Prisma monitorando.");

    if (this.countdownIntervalId) clearInterval(this.countdownIntervalId);

    this.countdownIntervalId = setInterval(() => {
      this.countdown.update(c => {
        const nextVal = c - 1;
        
        if (nextVal === 57 && !this.isLoading()) {
          this.forceScan();
        }

        return nextVal > 0 ? nextVal : 60;
      });
    }, 1000);
  }

  async forceScan() {
    const video = this.videoElement()?.nativeElement;
    const canvas = this.canvasElement()?.nativeElement;

    if (!video || !canvas || video.readyState < 2 || this.isLoading()) return;

    this.isLoading.set(true);
    this.analysisResult.set(null);
    
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        this.isLoading.set(false);
        return;
    };

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);

    try {
      const resultText = await this.geminiService.analyzeLiveFrame(imageDataUrl);
      const parsedResult = this.parsePrismaResponse(resultText);
      this.analysisResult.set(parsedResult);

      if (parsedResult.signal !== 'AGUARDAR' && parsedResult.signal !== 'ERRO') {
        this.addToHistory(parsedResult);
      }
    } catch (e: any) {
      console.error("Erro Prisma Scan:", e);
      this.error.set("Falha na comunicação neural.");
    } finally {
      this.isLoading.set(false);
    }
  }
  
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
      const parsedResult = this.parsePrismaResponse(resultText);
      this.analysisResult.set(parsedResult);
      if (parsedResult.signal === 'COMPRA' || parsedResult.signal === 'VENDA') {
        this.addToHistory(parsedResult);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Ocorreu um erro desconhecido durante a análise.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private parsePrismaResponse(text: string): Analysis {
    const signalMatch = text.match(/SINAL:\s*(COMPRA|VENDA|AGUARDAR)/i);
    const assetMatch = text.match(/no\s+([A-Z\/0-9]+)/i) || text.match(/ATIVO:\s*([A-Z\/0-9]+)/i);
    const reasonMatch = text.match(/MOTIVO:\s*([^|.]+)/i);
    const confidenceMatch = text.match(/Confiança:\s*(\d+%)/i);

    return {
      signal: (signalMatch?.[1]?.toUpperCase() || 'AGUARDAR') as any,
      time: new Date().toLocaleTimeString('pt-BR'),
      reason: reasonMatch?.[1]?.trim() || 'Análise de fluxo',
      asset: assetMatch?.[1] || 'Detectando...',
      assertividade: confidenceMatch?.[1] || '---'
    };
  }

  private speak(text: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.2;
    window.speechSynthesis.speak(utterance);
  }

  private loadHistoryFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const storedHistory = localStorage.getItem('prismaAiHistory');
      if (storedHistory) {
        try {
          this.history.set(JSON.parse(storedHistory));
        } catch (e) {
          localStorage.removeItem('prismaAiHistory');
        }
      }
    }
  }

  private saveHistoryToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('prismaAiHistory', JSON.stringify(this.history()));
    }
  }

  private addToHistory(analysis: Analysis) {
    if (analysis.signal !== 'COMPRA' && analysis.signal !== 'VENDA') return;
    const newItem: HistoryItem = {
      id: Date.now(),
      time: analysis.time,
      asset: analysis.asset || '---',
      direction: analysis.signal,
      result: 'PENDENTE'
    };
    this.history.update(current => [newItem, ...current].slice(0, 20));
    this.saveHistoryToStorage();
  }

  markAsWin(id: number) {
    this.history.update(current => 
      current.map(item => item.id === id ? { ...item, result: 'VITÓRIA' } : item)
    );
    this.saveHistoryToStorage();
  }

  markAsLoss(id: number) {
    this.history.update(current => 
      current.map(item => item.id === id ? { ...item, result: 'DERROTA' } : item)
    );
    this.saveHistoryToStorage();
  }

  clearHistory(): void {
    this.history.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('prismaAiHistory');
    }
  }
  
  getSignalClasses(signal: string) {
    if (signal === 'COMPRA') return 'text-green-400';
    if (signal === 'VENDA') return 'text-red-400';
    return 'text-yellow-400';
  }
}
