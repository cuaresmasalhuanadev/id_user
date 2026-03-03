import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon">🛒</span>
          <div>
            <div class="brand-name">Biegs Frits</div>
            <div class="brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="productos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Productos</span>
          </a>
          <a routerLink="categorias" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏷️</span>
            <span>Categorías</span>
          </a>
          <a routerLink="reniec" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🪪</span>
            <span>RENIEC</span>
          </a>
          <a routerLink="boletas" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🧾</span>
            <span>Boletas</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="admin-info">
            <div class="admin-avatar">{{ adminInitial }}</div>
            <div>
              <div class="admin-email">{{ adminEmail }}</div>
              <div class="admin-role">Administrador</div>
            </div>
          </div>
          <div class="sidebar-actions">
            <button class="btn btn-secondary btn-sm" (click)="goStore()">🏬 Ver tienda</button>
            <button class="btn btn-danger btn-sm" (click)="logout()">🔓 Salir</button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="dashboard-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 240px; min-width: 240px;
      background: #1a1a2e;
      border-right: 1px solid #252547;
      display: flex; flex-direction: column;
      padding: 0;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid #252547;
    }
    .brand-icon { font-size: 28px; }
    .brand-name { font-family: 'Poppins', sans-serif; font-weight: 700; color: #F4C430; font-size: 15px; }
    .brand-sub { color: #a0a0c0; font-size: 11px; }

    .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: 8px;
      color: #a0a0c0; font-size: 14px; font-weight: 500;
      text-decoration: none; transition: all 0.2s;
    }
    .nav-item:hover { background: #16213e; color: #f0f0ff; }
    .nav-item.active { background: rgba(244,196,48,0.12); color: #F4C430; font-weight: 600; }
    .nav-icon { font-size: 18px; }

    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid #252547;
    }
    .admin-info { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .admin-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #F4C430, #d4a017);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #000; font-size: 15px; flex-shrink: 0;
    }
    .admin-email { font-size: 11px; color: #f0f0ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .admin-role { font-size: 10px; color: #a0a0c0; }
    .sidebar-actions { display: flex; flex-direction: column; gap: 6px; }
    .btn-sm { padding: 7px 12px; font-size: 12px; justify-content: center; }

    .dashboard-main {
      flex: 1; overflow-y: auto;
      background: #0f0f1a;
      padding: 32px;
    }

    @media (max-width: 768px) {
      .sidebar { width: 64px; min-width: 64px; }
      .brand-name, .brand-sub, .nav-item span:last-child,
      .admin-info div, .sidebar-actions { display: none; }
      .brand-icon { font-size: 24px; }
      .sidebar-brand { justify-content: center; padding: 16px; }
      .nav-item { justify-content: center; padding: 14px; }
      .admin-avatar { margin: 0 auto; }
      .dashboard-main { padding: 16px; }
    }
  `]
})
export class AdminDashboardComponent {
  get adminEmail() { return this.auth.getAdmin()?.email ?? ''; }
  get adminInitial() { return this.adminEmail.charAt(0).toUpperCase(); }

  constructor(private auth: AuthService, private router: Router) { }

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  goStore() { this.router.navigate(['/tienda']); }
}
