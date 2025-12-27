
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
        <div class="p-2 bg-white/5 flex justify-between items-center rounded-md"
          [class.border-l-2]="true"
          [class.border-green-500]="item.direction === 'COMPRA'"
          [class.border-red-500]="item.direction === 'VENDA'"
        >
          <span>{{ item.time.slice(0, 5) }} - {{ item.asset.substring(0, 7) }} - {{ item.direction }}</span>
          
          @if (item.result === 'PENDENTE') {
            <div class="flex gap-1.5">
              <button (click)="markWin.emit(item.id)" class="text-green-500 hover:text-green-400 transition-colors">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              </button>
              <button (click)="markLoss.emit(item.id)" class="text-red-500 hover:text-red-400 transition-colors">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          } @else if (item.result === 'WIN') {
            <span class="font-bold text-green-400">{{ item.result }}</span>
          } @else {
            <span class="font-bold text-red-400">{{ item.result }}</span>
          }
        </div>
      }
      @if (history().length === 0) {
        <p class="text-gray-600 text-[10px] text-center italic py-4">Aguardando sinais...</p>
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
