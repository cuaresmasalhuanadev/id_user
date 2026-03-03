import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';

interface ReniecResult {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  document_number: string;
  genero: string | null;
  fecha_nacimiento: string | null;
  codigo_verificacion: string | null;
}

interface QueryHistory {
  dni: string; nombre_completo: string; nombres: string;
  apellido_paterno: string; apellido_materno: string;
  genero: string | null; fecha_nacimiento: string | null;
  provider: string; timestamp: Date;
}

@Component({
  selector: 'app-admin-reniec',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h2>🪪 Consulta RENIEC</h2>
          <p class="text-muted" style="font-size:13px;margin-top:4px">
            Servicios de identidad — Decolecta &amp; PeruDevs API
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="showTokenMgr = !showTokenMgr">
          {{ showTokenMgr ? '✕ Cerrar' : '⚙️ Gestionar tokens' }}
        </button>
      </div>

      <!-- ── TOKEN MANAGER ───────────────────────────────── -->
      <div class="token-card card" *ngIf="showTokenMgr">
        <h3 style="margin-bottom:20px">⚙️ Tokens de API</h3>

        <!-- STATUS TABLE -->
        <div class="token-list">
          <div class="tl-row header">
            <span>API</span><span>Estado</span><span>Token guardado</span><span>Última actualización</span><span>Notas</span>
          </div>
          <div class="tl-row" [class.tl-active]="status.perudevs.configured">
            <span><strong>🔶 PeruDevs</strong></span>
            <span>
              <span class="badge" [class.badge-success]="status.perudevs.configured" [class.badge-danger]="!status.perudevs.configured">
                {{ status.perudevs.configured ? '✅ Activo' : '⚠️ Sin token' }}
              </span>
            </span>
            <span class="mono" style="font-size:12px">{{ status.perudevs.configured ? '••••' + status.perudevs.lastFour : '—' }}</span>
            <span class="text-muted" style="font-size:11px">{{ status.perudevs.updatedAt ? formatDate(status.perudevs.updatedAt) : '—' }}</span>
            <span class="text-muted" style="font-size:11px">{{ status.perudevs.notes || '—' }}</span>
          </div>
          <div class="tl-row" [class.tl-active]="status.decolecta.configured">
            <span><strong>🔷 Decolecta</strong></span>
            <span>
              <span class="badge" [class.badge-success]="status.decolecta.configured" [class.badge-danger]="!status.decolecta.configured">
                {{ status.decolecta.configured ? '✅ Activo' : '⚠️ Sin token' }}
              </span>
            </span>
            <span class="mono" style="font-size:12px">{{ status.decolecta.configured ? '••••' + status.decolecta.lastFour : '—' }}</span>
            <span class="text-muted" style="font-size:11px">{{ status.decolecta.updatedAt ? formatDate(status.decolecta.updatedAt) : '—' }}</span>
            <span class="text-muted" style="font-size:11px">{{ status.decolecta.notes || '—' }}</span>
          </div>
        </div>

        <div class="providers-grid" style="margin-top:20px">
          <!-- Decolecta -->
          <div class="provider-box">
            <div class="provider-header">
              <span class="provider-logo">🔷</span>
              <div>
                <strong>Decolecta</strong>
                <p class="text-muted" style="font-size:11px">api.decolecta.com</p>
              </div>
            </div>
            <div class="form-group">
              <label>Bearer Token</label>
              <div style="display:flex;gap:6px">
                <input [type]="showDec ? 'text' : 'password'" [(ngModel)]="dec.token" name="decToken"
                       placeholder="sk_XXXXX..." style="font-family:monospace;font-size:12px;flex:1" />
                <button class="btn btn-secondary btn-xs" (click)="showDec=!showDec">{{ showDec?'🙈':'👁️' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Notas</label>
              <input type="text" [(ngModel)]="dec.notes" placeholder="100 consultas/mes..." />
            </div>
            <button class="btn btn-primary btn-sm" (click)="saveToken('decolecta','reniec_token_decolecta')" [disabled]="dec.saving || !dec.token.trim()">
              {{ dec.saving ? 'Guardando...' : '💾 Guardar token' }}
            </button>
            <p class="save-ok" *ngIf="dec.saved">✅ Guardado — token activo</p>
          </div>

          <!-- PeruDevs -->
          <div class="provider-box provider-highlighted">
            <div class="provider-header">
              <span class="provider-logo">🔶</span>
              <div>
                <strong>PeruDevs</strong>
                <span class="badge badge-gold" style="margin-left:6px;font-size:9px">RECOMENDADO</span>
                <p class="text-muted" style="font-size:11px">api.perudevs.com</p>
              </div>
            </div>
            <div class="form-group">
              <label>API Key</label>
              <div style="display:flex;gap:6px">
                <input [type]="showPeru ? 'text' : 'password'" [(ngModel)]="peru.token" name="peruToken"
                       placeholder="cGVydWRldnMu..." style="font-family:monospace;font-size:12px;flex:1" />
                <button class="btn btn-secondary btn-xs" (click)="showPeru=!showPeru">{{ showPeru?'🙈':'👁️' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Notas</label>
              <input type="text" [(ngModel)]="peru.notes" placeholder="Límite mensual..." />
            </div>
            <button class="btn btn-primary btn-sm" (click)="saveToken('perudevs','reniec_token_perudevs')" [disabled]="peru.saving || !peru.token.trim()">
              {{ peru.saving ? 'Guardando...' : '💾 Guardar token' }}
            </button>
            <p class="save-ok" *ngIf="peru.saved">✅ Guardado — token activo</p>
          </div>
        </div>
      </div>

      <!-- ── SEARCH FORM ──────────────────────────────────── -->
      <div class="card search-card">
        <h3 style="margin-bottom:20px">🔍 Consultar por DNI</h3>

        <!-- Provider selector -->
        <div class="provider-tabs">
          <button class="tab-btn" [class.active]="provider === 'perudevs'"  (click)="provider='perudevs'">
            🔶 PeruDevs <span class="tab-badge">Datos completos</span>
          </button>
          <button class="tab-btn" [class.active]="provider === 'decolecta'" (click)="provider='decolecta'">
            🔷 Decolecta <span class="tab-badge">Básico</span>
          </button>
        </div>

        <!-- DNI Input -->
        <div class="dni-row">
          <div class="dni-input-wrap">
            <span class="dni-flag">🇵🇪</span>
            <input type="text" class="dni-input" [(ngModel)]="dniInput"
                   maxlength="8" placeholder="00000000"
                   (keyup.enter)="consultar()"
                   (ngModelChange)="onDniChange($event)" />
            <span class="dni-counter" [class.full]="dniInput.length===8">{{ dniInput.length }}/8</span>
          </div>
          <button class="btn btn-primary consult-btn" (click)="consultar()"
                  [disabled]="dniInput.length !== 8 || loading">
            {{ loading ? '⏳ Consultando...' : '🔎 Consultar' }}
          </button>
        </div>

        <p class="no-token-warn" *ngIf="!canConsult">
          ⚠️ Configura el token de <strong>{{ provider === 'perudevs' ? 'PeruDevs' : 'Decolecta' }}</strong> antes de consultar.
          <button class="btn btn-secondary btn-xs" (click)="showTokenMgr=true">Configurar →</button>
        </p>

        <!-- ERROR -->
        <div class="query-error" *ngIf="queryError">⚠️ {{ queryError }}</div>

        <!-- SUCCESS RESULT -->
        <div class="result-card" *ngIf="resultData">
          <div class="result-header">
            <div class="result-avatar">{{ initials(resultData) }}</div>
            <div>
              <h3 class="result-name">{{ resultData.nombre_completo }}</h3>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <span class="badge badge-success">✅ Verificado RENIEC</span>
                <span class="badge badge-gold">{{ lastProvider === 'perudevs' ? '🔶 PeruDevs' : '🔷 Decolecta' }}</span>
              </div>
            </div>
          </div>

          <div class="result-grid">
            <div class="result-field">
              <span class="rf-label">📋 DNI</span>
              <span class="rf-value mono">{{ resultData.document_number }}</span>
            </div>
            <div class="result-field" *ngIf="resultData.genero">
              <span class="rf-label">⚧ Sexo</span>
              <span class="rf-value">{{ resultData.genero === 'M' ? '👨 Masculino' : '👩 Femenino' }}</span>
            </div>
            <div class="result-field">
              <span class="rf-label">👤 Nombres</span>
              <span class="rf-value">{{ resultData.nombres }}</span>
            </div>
            <div class="result-field">
              <span class="rf-label">👨‍👩‍👧 Ap. Paterno</span>
              <span class="rf-value">{{ resultData.apellido_paterno }}</span>
            </div>
            <div class="result-field">
              <span class="rf-label">👨‍👩‍👧 Ap. Materno</span>
              <span class="rf-value">{{ resultData.apellido_materno }}</span>
            </div>
            <div class="result-field" *ngIf="resultData.fecha_nacimiento">
              <span class="rf-label">🎂 F. Nacimiento</span>
              <span class="rf-value">{{ resultData.fecha_nacimiento }}</span>
            </div>
            <div class="result-field" *ngIf="resultData.codigo_verificacion">
              <span class="rf-label">🔢 Cód. Verificación</span>
              <span class="rf-value mono">{{ resultData.codigo_verificacion }}</span>
            </div>
            <div class="result-field full">
              <span class="rf-label">📝 Nombre completo</span>
              <span class="rf-value" style="font-size:16px;font-weight:700">{{ resultData.nombre_completo }}</span>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" (click)="copy(resultData.nombre_completo)">📋 Copiar nombre</button>
            <button class="btn btn-secondary btn-sm" (click)="copy(resultData.document_number)">📋 Copiar DNI</button>
            <button class="btn btn-secondary btn-sm" (click)="dniInput=''; resultData=null; queryError=''">🔄 Nueva consulta</button>
          </div>
        </div>
      </div>

      <!-- ── HISTORY ──────────────────────────────────────── -->
      <div class="card" *ngIf="history.length > 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3>🕐 Historial de la sesión ({{ history.length }})</h3>
          <button class="btn btn-danger btn-sm" (click)="history=[]">Limpiar</button>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>DNI</th><th>Nombre Completo</th><th>Nombres</th>
                <th>Ap. Paterno</th><th>Ap. Materno</th>
                <th>Sexo</th><th>F. Nac.</th><th>API</th><th>Hora</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of history">
                <td><span class="mono badge badge-info">{{ h.dni }}</span></td>
                <td><strong>{{ h.nombre_completo }}</strong></td>
                <td>{{ h.nombres }}</td>
                <td>{{ h.apellido_paterno }}</td>
                <td>{{ h.apellido_materno }}</td>
                <td>{{ h.genero || '—' }}</td>
                <td class="text-muted">{{ h.fecha_nacimiento || '—' }}</td>
                <td><span class="badge badge-gold" style="font-size:9px">{{ h.provider }}</span></td>
                <td class="text-muted" style="font-size:11px">{{ h.timestamp | date:'HH:mm:ss' }}</td>
                <td><button class="btn btn-secondary btn-sm" (click)="loadHist(h)">↩️</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Tokens */
    .token-card { border-color: rgba(244,196,48,0.3); margin-bottom: 20px; }
    .providers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .provider-box {
      background: var(--dark); border: 1px solid var(--dark-border);
      border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 12px;
    }
    .provider-highlighted { border-color: rgba(244,196,48,0.4); }
    .provider-header { display: flex; align-items: center; gap: 10px; }
    .provider-logo { font-size: 24px; }
    .p-info { font-size: 12px; }
    .save-ok { color: #22c55e; font-size: 12px; }
    .btn-xs { padding: 6px 10px; font-size: 11px; }
    /* Token list table */
    .token-list { border: 1px solid var(--dark-border); border-radius: 8px; overflow: hidden; margin-bottom: 4px; }
    .tl-row { display: grid; grid-template-columns: 140px 110px 120px 1fr 1fr; gap: 0; padding: 10px 14px; border-bottom: 1px solid var(--dark-border); align-items: center; font-size: 12px; }
    .tl-row:last-child { border-bottom: none; }
    .tl-row.header { background: var(--dark-secondary); font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-secondary); font-weight: 600; padding: 8px 14px; }
    .tl-row.tl-active { background: rgba(34,197,94,0.04); }
    .badge-danger { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }

    /* Tabs */
    .provider-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; background: var(--dark); border: 1px solid var(--dark-border);
      border-radius: 8px; color: var(--text-secondary); cursor: pointer;
      font-size: 14px; font-weight: 600; transition: all 0.2s;
    }
    .tab-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(244,196,48,0.06); }
    .tab-badge { font-size: 10px; color: var(--text-secondary); font-weight: 400; }
    .tab-btn.active .tab-badge { color: var(--gold); }

    /* DNI input */
    .dni-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
    .dni-input-wrap {
      display: flex; align-items: center; gap: 10px; flex: 1;
      background: var(--dark-secondary); border: 2px solid var(--dark-border);
      border-radius: 10px; padding: 0 16px; transition: border-color 0.2s;
    }
    .dni-input-wrap:focus-within { border-color: var(--gold); }
    .dni-flag { font-size: 22px; }
    .dni-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text-primary); font-size: 24px; font-family: monospace;
      font-weight: 700; letter-spacing: 4px; padding: 14px 0;
    }
    .dni-input::placeholder { font-size: 14px; letter-spacing: 1px; font-weight: 400; color: var(--text-secondary); }
    .dni-counter { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
    .dni-counter.full { color: var(--gold); font-weight: 700; }
    .consult-btn { padding: 14px 28px; font-size: 15px; flex-shrink: 0; }
    .no-token-warn { color: #ef4444; font-size: 13px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .query-error { padding: 12px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #ef4444; font-size: 13px; margin-top: 10px; }

    /* Result */
    .result-card { margin-top: 20px; padding: 22px; background: var(--dark); border: 1px solid rgba(34,197,94,0.25); border-radius: 12px; animation: slideUp 0.3s ease; }
    .result-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .result-avatar { width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--gold), var(--gold-dark)); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #000; }
    .result-name { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
    .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .result-field { background: var(--dark-secondary); border: 1px solid var(--dark-border); border-radius: 8px; padding: 11px 14px; display: flex; flex-direction: column; gap: 4px; }
    .result-field.full { grid-column: 1 / -1; }
    .rf-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; }
    .rf-value { font-size: 14px; color: var(--text-primary); font-weight: 600; }
    .mono { font-family: monospace; }
    .btn-sm { padding: 7px 14px; font-size: 12px; }

    @media (max-width:640px) {
      .providers-grid { grid-template-columns: 1fr; }
      .result-grid { grid-template-columns: 1fr; }
      .dni-row { flex-direction: column; align-items: stretch; }
      .consult-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class AdminReniecComponent implements OnInit {
  dniInput = '';
  loading = false;
  resultData: ReniecResult | null = null;
  queryError = '';
  history: QueryHistory[] = [];
  provider: 'perudevs' | 'decolecta' = 'perudevs';
  lastProvider = 'perudevs';

  showTokenMgr = false;
  showDec = false;
  showPeru = false;

  status = {
    decolecta: { configured: false, notes: '', updatedAt: null as string | null, lastFour: '' },
    perudevs: { configured: false, notes: '', updatedAt: null as string | null, lastFour: '' }
  };

  dec = { token: '', notes: '', saving: false, saved: false };
  peru = { token: '', notes: '', saving: false, saved: false };

  constructor(private configSvc: ConfigService) { }

  ngOnInit() { this.loadStatus(); }

  loadStatus() {
    this.configSvc.getTokenStatus().subscribe({
      next: (r: any) => {
        this.status.decolecta = r.decolecta ?? this.status.decolecta;
        this.status.perudevs = r.perudevs ?? this.status.perudevs;
        this.dec.notes = r.decolecta?.notes || '';
        this.peru.notes = r.perudevs?.notes || '';
      }
    });
  }

  get canConsult(): boolean {
    return this.provider === 'perudevs' ? this.status.perudevs.configured : this.status.decolecta.configured;
  }

  saveToken(prov: string, key: string) {
    const obj = prov === 'perudevs' ? this.peru : this.dec;
    if (!obj.token.trim()) return;
    obj.saving = true;
    const label = prov === 'perudevs' ? 'Token API PeruDevs' : 'Token API Decolecta';
    this.configSvc.upsert(key, obj.token.trim(), label, obj.notes).subscribe({
      next: () => {
        obj.saving = false; obj.saved = true; obj.token = '';
        this.status[prov === 'perudevs' ? 'perudevs' : 'decolecta'].configured = true;
        setTimeout(() => obj.saved = false, 3000);
        this.loadStatus();
      },
      error: () => { obj.saving = false; }
    });
  }

  onDniChange(val: string) {
    this.dniInput = val.replace(/[^0-9]/g, '').slice(0, 8);
    this.resultData = null;
    this.queryError = '';
  }

  consultar() {
    if (this.dniInput.length !== 8 || this.loading || !this.canConsult) return;
    this.loading = true;
    this.resultData = null;
    this.queryError = '';
    this.lastProvider = this.provider;

    this.configSvc.consultarDni(this.dniInput, this.provider).subscribe({
      next: (r: any) => {
        this.loading = false;
        this.resultData = r.data;
        this.history.unshift({
          dni: r.data.document_number,
          nombre_completo: r.data.nombre_completo,
          nombres: r.data.nombres,
          apellido_paterno: r.data.apellido_paterno,
          apellido_materno: r.data.apellido_materno,
          genero: r.data.genero,
          fecha_nacimiento: r.data.fecha_nacimiento,
          provider: this.provider,
          timestamp: new Date()
        });
        if (this.history.length > 50) this.history.pop();
      },
      error: (e: any) => {
        this.loading = false;
        this.queryError = e.error?.message ?? 'Error al consultar el DNI.';
      }
    });
  }

  loadHist(h: QueryHistory) {
    this.dniInput = h.dni;
    this.resultData = {
      id: h.dni, nombres: h.nombres, apellido_paterno: h.apellido_paterno,
      apellido_materno: h.apellido_materno, nombre_completo: h.nombre_completo,
      document_number: h.dni, genero: h.genero, fecha_nacimiento: h.fecha_nacimiento,
      codigo_verificacion: null
    };
    this.lastProvider = h.provider;
    this.queryError = '';
  }

  initials(r: ReniecResult) { return (r.apellido_paterno?.[0] ?? '') + (r.nombres?.[0] ?? ''); }
  copy(text: string) { navigator.clipboard.writeText(text).catch(() => { }); }
  formatDate(d: string) { return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
}
