import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="login-page">
      <!-- Back link -->
      <div class="back-bar">
        <button class="btn-back" (click)="goStore()">← Volver a la tienda</button>
      </div>

      <div class="login-container">
        <div class="login-card">
          <!-- Logo -->
          <div class="login-logo">
            <div class="logo-icon">🛒</div>
            <h1 class="logo-title">Biegs Frits Store</h1>
            <p class="logo-sub">Panel de Administración</p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>📧 Correo electrónico</label>
              <input type="email" [(ngModel)]="form.email" name="email"
                     placeholder="admin@ejemplo.com" required />
            </div>

            <div class="form-group">
              <label>📱 WhatsApp (con código de país)</label>
              <input type="text" [(ngModel)]="form.whatsapp" name="whatsapp"
                     placeholder="+51900000000" required maxlength="16" />
              <small class="hint">Solo dígitos con prefijo: +51 (Perú), +1 (USA), etc.</small>
            </div>

            <div class="form-group">
              <label>🔑 Código de referido</label>
              <input [type]="showCode ? 'text' : 'password'" [(ngModel)]="form.referralCode"
                     name="referralCode" placeholder="••••••••••" required />
              <button type="button" class="toggle-pass" (click)="showCode = !showCode">
                {{ showCode ? '🙈 Ocultar' : '👁️ Ver' }}
              </button>
            </div>

            <div class="error-msg" *ngIf="error">
              ⚠️ {{ error }}
            </div>

            <button type="submit" class="btn btn-primary w-full login-btn" [disabled]="loading">
              <span *ngIf="!loading">🔐 Iniciar sesión</span>
              <span *ngIf="loading">⏳ Verificando...</span>
            </button>
          </form>

          <p class="login-help">Acceso exclusivo para administradores.</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      min-height: 100vh;
      background: radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0f0f1a 70%);
    }
    .back-bar {
      padding: 16px 24px;
    }
    .btn-back {
      background: none; border: none; color: #a0a0c0;
      cursor: pointer; font-size: 14px; transition: color 0.2s;
    }
    .btn-back:hover { color: #F4C430; }
    .login-container {
      display: flex; align-items: center; justify-content: center;
      min-height: calc(100vh - 60px); padding: 24px;
    }
    .login-card {
      background: #16213e;
      border: 1px solid #252547;
      border-radius: 16px;
      padding: 40px;
      width: min(420px, 100%);
      box-shadow: 0 24px 64px rgba(0,0,0,0.5);
      animation: slideUp 0.3s ease;
    }
    .login-logo {
      text-align: center; margin-bottom: 32px;
    }
    .logo-icon { font-size: 48px; margin-bottom: 8px; }
    .logo-title {
      font-family: 'Poppins', sans-serif;
      font-size: 22px; color: #F4C430; margin-bottom: 4px;
    }
    .logo-sub { color: #a0a0c0; font-size: 13px; }
    .hint { color: #a0a0c0; font-size: 11px; margin-top: 4px; display: block; }
    .toggle-pass {
      background: none; border: none; color: #a0a0c0;
      font-size: 12px; cursor: pointer; margin-top: 4px;
      padding: 0;
    }
    .toggle-pass:hover { color: #F4C430; }
    .error-msg {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px;
      padding: 12px 16px;
      color: #ef4444;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .login-btn {
      height: 48px; font-size: 15px; margin-bottom: 16px;
      background: linear-gradient(135deg, #F4C430, #d4a017);
    }
    .login-help {
      text-align: center; color: #555; font-size: 12px;
    }
  `]
})
export class AdminLoginComponent {
    form = { email: '', whatsapp: '', referralCode: '' };
    loading = false;
    error = '';
    showCode = false;

    constructor(private auth: AuthService, private router: Router) {
        if (this.auth.isAuthenticated()) {
            this.router.navigate(['/admin/dashboard']);
        }
    }

    onSubmit() {
        this.error = '';

        // Validate WhatsApp format
        const waRegex = /^\+(1|51|52|54|55|56|57|58|591|593|595|598)\d{7,13}$/;
        if (!waRegex.test(this.form.whatsapp)) {
            this.error = 'Número WhatsApp inválido. Formato: +51XXXXXXXXX';
            return;
        }

        this.loading = true;
        this.auth.login(this.form).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.success) {
                    this.router.navigate(['/admin/dashboard']);
                } else {
                    this.error = 'Credenciales incorrectas.';
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Error al conectar. Intenta de nuevo.';
            }
        });
    }

    goStore() { this.router.navigate(['/tienda']); }
}
