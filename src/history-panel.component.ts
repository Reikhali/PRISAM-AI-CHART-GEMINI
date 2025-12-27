import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HistoryItem {
  id: number;
  time: string;
  asset: string;
  direction: 'COMPRA' | 'VENDA';
  result: 'WIN' | 'LOSS' | 'PENDENTE';
}

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2 text-[11px] font-mono">
      @for (item of history(); track item.id) {
        <div class="p-2.5 bg-black/40 border border-purple-500/10 flex justify-between items-center rounded-xl transition-all hover:bg-white/5"
          [class.border-l-4]="true"
          [class.border-l-green-500]="item.direction === 'COMPRA'"
          [class.border-l-red-500]="item.direction === 'VENDA'"
        >
          <div class="flex flex-col">
            <span class="text-[9px] text-gray-500 uppercase">{{ item.time }}</span>
            <span class="text-white font-bold">{{ item.asset }}</span>
          </div>

          <div class="flex items-center gap-3">
            <span [class]="item.direction === 'COMPRA' ? 'text-green-500' : 'text-red-500'" class="font-black italic text-[10px]">
              {{ item.direction }}
            </span>
            
            @if (item.result === 'PENDENTE') {
              <div class="flex gap-2">
                <button (click)="markWin.emit(item.id)" title="Marcar Win"
                  class="p-1 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500 hover:text-white transition-all">
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                </button>
                <button (click)="markLoss.emit(item.id)" title="Marcar Loss"
                  class="p-1 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all">
                  <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
            } @else {
              <span class="px-2 py-0.5 rounded text-[9px] font-black tracking-tighter"
                [class]="item.result === 'WIN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                {{ item.result }}
              </span>
            }
          </div>
        </div>
      }
      
      @if (history().length === 0) {
        <div class="flex flex-col items-center justify-center py-10 opacity-30">
          <svg class="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <p class="text-[10px] uppercase font-bold tracking-widest text-purple-400">Aguardando sinais...</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPanelComponent {
  history = input.required<HistoryItem[]>();
  markWin = output<number>();
  markLoss = output<number>();
}