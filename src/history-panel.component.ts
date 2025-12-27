
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HistoryItem {
  id: number;
  time: string;
  asset: string;
  direction: 'COMPRA' | 'VENDA';
  result: 'VITÓRIA' | 'DERROTA' | 'PENDENTE';
}

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2 font-sans">
      @for (item of history(); track item.id) {
        <div class="p-3 bg-white/5 rounded-lg flex justify-between items-center transition-all hover:bg-white/10 border border-transparent hover:border-primary/20"
          [class.border-l-2]="item.result !== 'PENDENTE'"
          [class.border-l-green-500]="item.result === 'VITÓRIA'"
          [class.border-l-red-500]="item.result === 'DERROTA'"
        >
          <div class="flex items-center gap-3">
             <div class="w-8 h-8 rounded-full flex items-center justify-center"
                [ngClass]="{
                    'bg-green-500/10 text-green-400': item.direction === 'COMPRA',
                    'bg-red-500/10 text-red-400': item.direction === 'VENDA'
                }">
                <span class="material-icons-round text-base">
                    {{ item.direction === 'COMPRA' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
            </div>
            <div>
              <span class="font-bold text-sm text-white font-display">{{ item.asset }}</span>
              <p class="text-[10px] text-gray-500">{{ item.time }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (item.result === 'PENDENTE') {
              <div class="flex gap-1.5">
                <button (click)="markWin.emit(item.id)" title="Marcar Vitória"
                  class="w-7 h-7 flex items-center justify-center bg-green-500/10 text-green-500 rounded-md hover:bg-green-500 hover:text-black transition-all">
                  <span class="material-icons-round text-base">done</span>
                </button>
                <button (click)="markLoss.emit(item.id)" title="Marcar Derrota"
                  class="w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-black transition-all">
                  <span class="material-icons-round text-base">close</span>
                </button>
              </div>
            } @else {
              <span class="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider font-display"
                [class]="item.result === 'VITÓRIA' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                {{ item.result }}
              </span>
            }
          </div>
        </div>
      }
      
      @if (history().length === 0) {
        <div class="flex flex-col items-center justify-center h-full py-6 text-center text-gray-600">
          <span class="material-icons-round text-5xl">inventory_2</span>
          <p class="text-[10px] mt-2 tracking-widest font-display">NENHUM HISTÓRICO DE SINAL</p>
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
