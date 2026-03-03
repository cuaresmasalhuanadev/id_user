import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';

const IGV = 0.18;
const DESCUENTO_CUPON = 0.15;

function precioConIGV(base: number): number {
  return parseFloat((base * (1 + IGV)).toFixed(2));
}

function precioAnual(base: number): number {
  return parseFloat((precioConIGV(base) * 12).toFixed(2));
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <h2>📦 Gestión de Productos</h2>
        <button class="btn btn-primary" (click)="openModal()">+ Nuevo producto</button>
      </div>

      <!-- Loading -->
      <div class="spinner" *ngIf="loading"></div>

      <!-- Empty -->
      <div class="empty-state card" *ngIf="!loading && products.length === 0">
        <div style="font-size:48px;text-align:center;margin-bottom:12px">📦</div>
        <h3 style="text-align:center">Sin productos aún</h3>
        <p class="text-muted text-center">Agrega tu primer producto con el botón de arriba.</p>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden;overflow-x:auto" *ngIf="!loading && products.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Precio base</th>
              <th>+ IGV (18%)</th>
              <th>Duración</th>
              <th>Cupón</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of products">
              <td>
                <img [src]="p.imageUrl || 'https://placehold.co/60x60/1a1a2e/F4C430?text=📦'"
                     [alt]="p.name" class="product-thumb" />
              </td>
              <td>
                <strong>{{ p.name }}</strong>
                <p class="text-muted" style="font-size:12px;margin-top:2px">
                  {{ (p.description || '') | slice:0:40 }}{{ (p.description || '').length > 40 ? '...' : '' }}
                </p>
              </td>
              <td>
                <span class="text-muted" style="font-size:11px">Base</span><br/>
                <strong>S/ {{ p.price | number:'1.2-2' }}</strong>
              </td>
              <td>
                <span class="text-gold" style="font-weight:800">S/ {{ igv(p.price) | number:'1.2-2' }}</span>
                <span *ngIf="p.tipoDuracion === 'ANUAL'" class="block-note text-muted" style="font-size:11px">
                  Anual: S/ {{ anual(p.price) | number:'1.2-2' }}
                </span>
              </td>
              <td>
                <span class="badge"
                      [class.badge-info]="p.tipoDuracion==='MES'"
                      [class.badge-gold]="p.tipoDuracion==='ANUAL'"
                      [class.badge-danger]="p.tipoDuracion==='NINGUNO'">
                  {{ p.tipoDuracion }}
                </span>
              </td>
              <td>
                <span *ngIf="p.coupon" class="badge badge-success" style="font-family:monospace">
                  🎫 {{ p.coupon }}
                </span>
                <span *ngIf="!p.coupon" class="text-muted" style="font-size:12px">—</span>
              </td>
              <td>{{ p.stock }}</td>
              <td>
                <span class="badge" [class.badge-success]="p.active" [class.badge-danger]="!p.active">
                  {{ p.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-secondary btn-sm" (click)="openModal(p)">✏️</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteProduct(p)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal modal-wide" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editing ? '✏️ Editar producto' : '➕ Nuevo producto' }}</h3>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>

        <form (ngSubmit)="saveProduct()">
          <div class="form-group">
            <label>Nombre del producto *</label>
            <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Ej: Plan Premium" />
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea [(ngModel)]="form.description" name="description" placeholder="Describe el producto..."></textarea>
          </div>

          <!-- Precio + IGV preview -->
          <div class="price-grid">
            <div class="form-group">
              <label>Precio base (S/) * <span class="label-hint">sin IGV</span></label>
              <input type="number" [(ngModel)]="form.price" name="price" required min="0" step="0.10"
                     placeholder="0.00" (ngModelChange)="updatePricePreview()" />
            </div>
            <div class="form-group">
              <label>Duración</label>
              <select [(ngModel)]="form.tipoDuracion" name="tipoDuracion" (ngModelChange)="updatePricePreview()">
                <option value="NINGUNO">Sin duración</option>
                <option value="MES">Mensual</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>

          <!-- Price breakdown preview -->
          <div class="price-preview" *ngIf="form.price! > 0">
            <div class="price-row">
              <span>Precio base</span>
              <span>S/ {{ form.price | number:'1.2-2' }}</span>
            </div>
            <div class="price-row igv-row">
              <span>+ IGV (18%)</span>
              <span>S/ {{ igvOf(form.price!) | number:'1.2-2' }}</span>
            </div>
            <div class="price-row total-row">
              <span>💰 Precio final (mensual)</span>
              <span class="text-gold">S/ {{ igv(form.price!) | number:'1.2-2' }}</span>
            </div>
            <div class="price-row anual-row" *ngIf="form.tipoDuracion === 'ANUAL'">
              <span>🗓️ Precio anual (×12)</span>
              <span class="text-gold" style="font-size:16px;font-weight:800">S/ {{ anual(form.price!) | number:'1.2-2' }}</span>
            </div>
            <div class="price-row discount-row" *ngIf="form.coupon!.trim()">
              <span>🎫 Con cupón (−15%)</span>
              <span style="color:#22c55e">S/ {{ conDescuento(form.price!) | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="price-grid">
            <div class="form-group">
              <label>Stock</label>
              <input type="number" [(ngModel)]="form.stock" name="stock" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Categoría</label>
              <input type="text" [(ngModel)]="form.category" name="category" placeholder="Ej: Planes, Snacks..." />
            </div>
          </div>

          <div class="form-group">
            <label>🎫 Código de cupón <span class="label-hint">descuenta 15% al precio final con IGV</span></label>
            <input type="text" [(ngModel)]="form.coupon" name="coupon" placeholder="Ej: PROMO15, BIEGS2026"
                   style="text-transform:uppercase" (ngModelChange)="form.coupon = form.coupon!.toUpperCase()" />
            <small class="hint">Deja en blanco si no hay cupón para este producto.</small>
          </div>

          <div class="form-group">
            <label>URL de imagen</label>
            <input type="url" [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://..." />
          </div>

          <div class="form-group" *ngIf="editing">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" [(ngModel)]="form.active" name="active" style="width:auto" />
              Producto activo (visible en tienda)
            </label>
          </div>

          <div class="error-msg-f" *ngIf="formError">⚠️ {{ formError }}</div>

          <div style="display:flex;gap:10px">
            <button type="submit" class="btn btn-primary" style="flex:1" [disabled]="saving">
              {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear producto') }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .product-thumb { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; background: #0f0f1a; }
    .btn-sm { padding: 6px 10px; font-size: 12px; }
    .empty-state { text-align: center; padding: 48px 24px; }
    .label-hint { color: #a0a0c0; font-weight: 400; font-size: 11px; }
    .hint { color: #a0a0c0; font-size: 11px; margin-top: 4px; display: block; }
    .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .price-preview {
      background: #0f0f1a; border: 1px solid #252547; border-radius: 8px;
      padding: 14px 18px; margin: -4px 0 20px; font-size: 14px;
    }
    .price-row { display: flex; justify-content: space-between; padding: 5px 0; color: #a0a0c0; }
    .igv-row { border-top: 1px solid #252547; }
    .total-row { border-top: 1px solid #F4C430; color: #f0f0ff; font-weight: 700; padding-top: 8px; }
    .anual-row { border-top: 1px dashed #F4C430; padding-top: 8px; }
    .discount-row { border-top: 1px dashed #22c55e; }
    .error-msg-f {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px; padding: 10px 14px; color: #ef4444;
      font-size: 13px; margin-bottom: 12px;
    }
    .modal-wide { width: min(560px, 95vw); }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  showModal = false;
  editing: Product | null = null;
  saving = false;
  formError = '';

  form: Partial<Product> = this.emptyForm();

  constructor(private productSvc: ProductService) { }
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.productSvc.getAll().subscribe({
      next: (res: any) => { this.products = res.data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  emptyForm(): Partial<Product> {
    return {
      name: '', description: '', price: 0, category: '', imageUrl: '',
      stock: 0, active: true, coupon: '', tipoDuracion: 'NINGUNO'
    };
  }

  openModal(p?: Product) {
    this.editing = p ?? null;
    this.form = p ? { ...p } : this.emptyForm();
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editing = null; }

  updatePricePreview() { /* triggers change detection */ }

  // Price helpers
  igvOf(base: number): number { return parseFloat((base * IGV).toFixed(2)); }
  igv(base: number): number { return precioConIGV(base); }
  anual(base: number): number { return precioAnual(base); }
  conDescuento(base: number): number {
    return parseFloat((precioConIGV(base) * (1 - DESCUENTO_CUPON)).toFixed(2));
  }

  saveProduct() {
    if (!this.form.name || (this.form.price ?? 0) <= 0) {
      this.formError = 'El nombre y precio son obligatorios.'; return;
    }
    this.saving = true;
    this.formError = '';
    const obs = this.editing
      ? this.productSvc.update(this.editing._id!, this.form)
      : this.productSvc.create(this.form);

    obs.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); },
      error: (e: any) => { this.saving = false; this.formError = e.error?.message ?? 'Error al guardar.'; }
    });
  }

  deleteProduct(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    this.productSvc.delete(p._id!).subscribe({ next: () => this.load() });
  }
}
