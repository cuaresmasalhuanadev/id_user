import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoletaService, Boleta, BoletaItem } from '../../services/boleta.service';
import { ProductService, Product } from '../../services/product.service';


@Component({
    selector: 'app-admin-boletas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="page-header">
        <h2>🧾 Boletas de Venta</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? '✕ Cancelar' : '+ Nueva boleta' }}
        </button>
      </div>

      <!-- GENERATOR FORM -->
      <div class="card mb-4" *ngIf="showForm">
        <h3 style="margin-bottom:20px">📝 Generar nueva boleta</h3>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label>Nombre del cliente *</label>
            <input type="text" [(ngModel)]="newBoleta.clienteNombre" placeholder="Nombre completo" />
          </div>
          <div class="form-group">
            <label>WhatsApp del cliente</label>
            <input type="text" [(ngModel)]="newBoleta.clienteWhatsapp" placeholder="+51..." />
          </div>
        </div>

        <!-- Items -->
        <div class="items-section">
          <div class="items-header flex justify-between items-center mb-4">
            <h4>Ítems</h4>
            <button class="btn btn-secondary btn-sm" type="button" (click)="addItem()">+ Agregar ítem</button>
          </div>

          <div class="item-row" *ngFor="let item of newBoleta.items; let i = index">
            <div class="form-group" style="flex:2">
              <label>Producto</label>
              <select [(ngModel)]="item.productId" (ngModelChange)="fillFromProduct(item)"
                      [name]="'prod-' + i">
                <option value="">— Escribir manualmente —</option>
                <option *ngFor="let p of products" [value]="p._id">{{ p.name }} (S/ {{ p.price }})</option>
              </select>
            </div>
            <div class="form-group" style="flex:2">
              <label>Descripción *</label>
              <input type="text" [(ngModel)]="item.nombre" [name]="'nom-' + i" placeholder="Nombre del ítem" />
            </div>
            <div class="form-group" style="flex:1">
              <label>Cant.</label>
              <input type="number" [(ngModel)]="item.cantidad" [name]="'qty-' + i" min="1" (ngModelChange)="calcItem(item)" />
            </div>
            <div class="form-group" style="flex:1">
              <label>Precio unit. (S/)</label>
              <input type="number" [(ngModel)]="item.precioUnit" [name]="'price-' + i" min="0" step="0.10" (ngModelChange)="calcItem(item)" />
            </div>
            <div class="form-group" style="flex:1">
              <label>Subtotal</label>
              <input type="text" [value]="'S/ ' + ((item.cantidad * item.precioUnit) | number:'1.2-2')" readonly
                     style="background:#0f0f1a;color:#F4C430;font-weight:700" />
            </div>
            <button type="button" class="btn btn-danger btn-sm remove-btn" (click)="removeItem(i)">✕</button>
          </div>

          <div class="totals-box card" *ngIf="(newBoleta.items?.length ?? 0) > 0">
            <div class="total-row"><span>Subtotal</span><span>S/ {{ calcSubtotal() | number:'1.2-2' }}</span></div>
            <div class="total-row"><span>IGV (18%)</span><span>S/ {{ calcIgv() | number:'1.2-2' }}</span></div>
            <div class="total-row total-final"><span>TOTAL</span><span>S/ {{ calcTotal() | number:'1.2-2' }}</span></div>
          </div>
        </div>

        <div class="error-msg-box" *ngIf="formError">⚠️ {{ formError }}</div>

        <button class="btn btn-primary" (click)="generateBoleta()" [disabled]="saving" style="min-width:180px">
          {{ saving ? '⏳ Generando...' : '🧾 Generar boleta' }}
        </button>
      </div>

      <!-- BOLETAS LIST -->
      <div class="spinner" *ngIf="loading"></div>

      <div class="empty-state card" *ngIf="!loading && boletas.length === 0 && !showForm">
        <div style="font-size:48px;text-align:center;margin-bottom:12px">🧾</div>
        <h3 style="text-align:center">No hay boletas aún</h3>
        <p class="text-muted text-center">Genera tu primera boleta con el botón de arriba.</p>
      </div>

      <div class="card" style="padding:0;overflow:hidden" *ngIf="!loading && boletas.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>N° Boleta</th>
              <th>Cliente</th>
              <th>WhatsApp</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of boletas">
              <td><span class="badge badge-gold">{{ b.numero }}</span></td>
              <td><strong>{{ b.clienteNombre }}</strong></td>
              <td><span class="text-muted">{{ b.clienteWhatsapp || '—' }}</span></td>
              <td class="text-gold" style="font-weight:800">S/ {{ b.total | number:'1.2-2' }}</td>
              <td class="text-muted" style="font-size:12px">{{ formatDate(b.emitidaEn) }}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-secondary btn-sm" (click)="downloadPdf(b)">⬇️ PDF</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteBoleta(b)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    .item-row {
      display: flex; gap: 12px; align-items: flex-end;
      padding: 14px; background: #0f0f1a; border-radius: 8px;
      margin-bottom: 10px; flex-wrap: wrap;
    }
    .remove-btn { padding: 10px; align-self: flex-end; margin-bottom: 20px; }
    .items-section { margin: 20px 0; }
    .totals-box {
      margin-top: 16px; padding: 16px;
      border-color: rgba(244,196,48,0.25);
    }
    .total-row {
      display: flex; justify-content: space-between;
      padding: 6px 0; color: #a0a0c0; font-size: 14px;
      border-bottom: 1px solid #252547;
    }
    .total-final {
      color: #F4C430; font-size: 18px; font-weight: 800; border: none;
      margin-top: 8px;
    }
    .error-msg-box {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px; padding: 10px 14px; color: #ef4444;
      font-size: 13px; margin-bottom: 16px;
    }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .empty-state { text-align: center; padding: 48px 24px; }
  `]
})
export class AdminBoletasComponent implements OnInit {
    boletas: Boleta[] = [];
    products: Product[] = [];
    loading = true;
    showForm = false;
    saving = false;
    formError = '';

    newBoleta: Partial<Boleta> = { clienteNombre: '', clienteWhatsapp: '', items: [] };

    constructor(private boletaSvc: BoletaService, private productSvc: ProductService) { }

    ngOnInit() {
        this.loadBoletas();
        this.productSvc.getAll().subscribe({ next: (r: any) => this.products = r.data ?? [] });
    }

    loadBoletas() {
        this.loading = true;
        this.boletaSvc.getAll().subscribe({
            next: (r: any) => { this.boletas = r.data ?? []; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    addItem() {
        this.newBoleta.items!.push({ productId: '', nombre: '', cantidad: 1, precioUnit: 0 });
    }

    removeItem(i: number) { this.newBoleta.items!.splice(i, 1); }

    calcItem(item: BoletaItem) { item.subtotal = item.cantidad * item.precioUnit; }

    fillFromProduct(item: BoletaItem) {
        const p = this.products.find(pr => pr._id === item.productId);
        if (p) { item.nombre = p.name; item.precioUnit = p.price; this.calcItem(item); }
    }

    calcSubtotal() { return this.newBoleta.items!.reduce((s, i) => s + (i.cantidad * i.precioUnit), 0); }
    calcIgv() { return this.calcSubtotal() * 0.18; }
    calcTotal() { return this.calcSubtotal() + this.calcIgv(); }

    generateBoleta() {
        this.formError = '';
        if (!this.newBoleta.clienteNombre) { this.formError = 'El nombre del cliente es obligatorio.'; return; }
        if (!this.newBoleta.items?.length) { this.formError = 'Agrega al menos un ítem.'; return; }
        const invalid = this.newBoleta.items.find(i => !i.nombre || i.cantidad < 1 || i.precioUnit <= 0);
        if (invalid) { this.formError = 'Todos los ítems deben tener nombre, cantidad y precio.'; return; }

        this.saving = true;
        this.boletaSvc.create(this.newBoleta).subscribe({
            next: () => {
                this.saving = false;
                this.showForm = false;
                this.newBoleta = { clienteNombre: '', clienteWhatsapp: '', items: [] };
                this.loadBoletas();
            },
            error: (e: any) => { this.saving = false; this.formError = e.error?.message ?? 'Error al generar boleta.'; }
        });
    }

    downloadPdf(b: Boleta) { this.boletaSvc.downloadPdf(b._id!); }

    deleteBoleta(b: Boleta) {
        if (!confirm(`¿Eliminar boleta ${b.numero}?`)) return;
        this.boletaSvc.delete(b._id!).subscribe({ next: () => this.loadBoletas() });
    }

    formatDate(d?: string): string {
        if (!d) return '—';
        return new Date(d).toLocaleString('es-PE', { timeZone: 'America/Lima' });
    }
}
