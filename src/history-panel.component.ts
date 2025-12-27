
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
    <div class="bg-black/60 p-4 rounded-xl border border-white/10 mt-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sky-400 text-sm font-bold flex items-center gap-2 uppercase">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
          Histórico de Sinais
        </h3>
        <span class="text-[10px] text-gray-500 font-mono">M1 PERFORMANCE</span>
      </div>

      <div class="space-y-2">
        @for (item of history(); track item.id) {
          <div class="flex items-center justify-between bg-white/5 p-2 rounded border-l-4"
            [class.border-sky-500]="item.result === 'PENDENTE'"
            [class.border-green-500]="item.result === 'WIN'"
            [class.border-red-500]="item.result === 'LOSS'"
          >
            <div>
              <div class="text-[10px] text-gray-400 font-mono">{{ item.time }} - {{ item.asset }}</div>
              <div class="font-bold text-xs"
                [class.text-green-400]="item.direction === 'COMPRA'"
                [class.text-red-400]="item.direction === 'VENDA'"
              >
                {{ item.direction }}
              </div>
            </div>
            @if (item.result === 'PENDENTE') {
              <div class="flex gap-2">
                <button (click)="markWin.emit(item.id)" class="hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </button>
                <button (click)="markLoss.emit(item.id)" class="hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </button>
              </div>
            } @else {
               <div class="font-bold text-xs px-2 py-1 rounded" 
                [class.bg-green-500/10]="item.result === 'WIN'"
                [class.text-green-400]="item.result === 'WIN'"
                [class.bg-red-500/10]="item.result === 'LOSS'"
                [class.text-red-400]="item.result === 'LOSS'"
               >
                {{ item.result }}
               </div>
            }
          </div>
        }
        @if (history().length === 0) {
          <p class="text-gray-600 text-[10px] text-center italic py-4">Aguardando primeira oportunidade...</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPanelComponent {
  history = input.required<HistoryItem[]>();
  markWin = output<number>();
  markLoss = output<number>();
}
