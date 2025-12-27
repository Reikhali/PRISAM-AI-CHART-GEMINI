
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="glass-panel rounded-3xl p-8 shadow-glass animate-float border border-primary/20">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-display font-bold text-white tracking-widest">
              PRISMA<span class="text-primary font-light">IA</span>
            </h1>
            <p class="text-xs text-primary/80 mt-2 tracking-widest font-display">PLATAFORMA DE ANÁLISE</p>
          </div>
          <form (submit)="handleLogin($event)" class="space-y-6">
            <div>
              <label for="username" class="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Usuário</label>
              <input 
                id="username" 
                type="text" 
                (input)="username.set($any($event.target).value)"
                [value]="username()"
                placeholder="Digite seu usuário"
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label for="password" class="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Senha</label>
              <input 
                id="password" 
                type="password"
                (input)="password.set($any($event.target).value)"
                [value]="password()"
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-gray-500"
              />
            </div>
            
            @if (error()) {
              <div class="text-red-400 text-xs text-center font-semibold bg-red-500/10 p-2 rounded-lg">
                {{ error() }}
              </div>
            }

            <button type="submit" class="w-full py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-glow transition-all font-display shadow-glow text-sm tracking-wider">
              CONECTAR
            </button>
          </form>
           <div class="mt-8 pt-6 border-t border-white/10 text-center">
            <a href="https://www.instagram.com/ia.prisma/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors duration-300 font-display">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-80"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              <span>@ia.prisma</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  loginSuccess = output<void>();

  username = signal('');
  password = signal('');
  error = signal<string | null>(null);

  handleLogin(event: Event) {
    event.preventDefault();
    if (this.username() === 'insta@tal_do_khali' && this.password() === '70721472') {
      this.error.set(null);
      this.loginSuccess.emit();
    } else {
      this.error.set('Usuário ou senha inválidos.');
    }
  }
}
