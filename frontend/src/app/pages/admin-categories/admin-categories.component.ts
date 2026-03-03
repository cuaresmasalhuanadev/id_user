import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../services/category.service';

const PRESET_ICONS = ['📦', '🍟', '🥤', '🍕', '🌟', '🎮', '💊', '🛒', '🏷️', '🎁', '🧃', '🍰', '💻', '📱', '🎫', '🛍️'];
const PRESET_COLORS = ['#F4C430', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#14b8a6', '#ec4899'];

@Component({
    selector: 'app-admin-categories',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
      <div class="page-header">
        <h2>🏷️ Gestión de Categorías</h2>
        <button class="btn btn-primary" (click)="openModal()">+ Nueva categoría</button>
      </div>

      <div class="spinner" *ngIf="loading"></div>

      <div class="empty-state card" *ngIf="!loading && categories.length === 0">
        <div style="font-size:48px;text-align:center;margin-bottom:12px">🏷️</div>
        <h3 style="text-align:center">Sin categorías aún</h3>
        <p class="text-muted text-center">Crea tu primera categoría para organizar los productos.</p>
      </div>

      <!-- Cards grid -->
      <div class="cat-grid" *ngIf="!loading && categories.length > 0">
        <div class="cat-card" *ngFor="let c of categories" [style.border-color]="c.color">
          <div class="cat-icon" [style.background]="c.color + '22'" [style.border-color]="c.color">
            <span style="font-size:28px">{{ c.icon }}</span>
          </div>
          <div class="cat-info">
            <div class="cat-name">{{ c.name }}</div>
            <div class="cat-desc text-muted">{{ c.description || 'Sin descripción' }}</div>
            <span class="badge" [class.badge-success]="c.active" [class.badge-danger]="!c.active" style="margin-top:6px">
              {{ c.active ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
          <div class="cat-actions">
            <button class="btn btn-secondary btn-sm" (click)="openModal(c)">✏️</button>
            <button class="btn btn-danger btn-sm" (click)="deleteCategory(c)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()" style="width:min(500px,95vw)">
        <div class="modal-header">
          <h3>{{ editing ? '✏️ Editar categoría' : '➕ Nueva categoría' }}</h3>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>

        <form (ngSubmit)="save()">
          <div class="form-group">
            <label>Nombre *</label>
            <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Ej: Snacks, Bebidas..." />
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <input type="text" [(ngModel)]="form.description" name="description" placeholder="Breve descripción..." />
          </div>

          <!-- Icon picker -->
          <div class="form-group">
            <label>Icono <span class="label-hint">selecciona uno</span></label>
            <div class="icon-picker">
              <button type="button" *ngFor="let icon of presetIcons"
                      class="icon-btn" [class.selected]="form.icon === icon"
                      (click)="form.icon = icon">{{ icon }}</button>
            </div>
            <input type="text" [(ngModel)]="form.icon" name="icon" placeholder="O escribe un emoji" />
          </div>

          <!-- Color picker -->
          <div class="form-group">
            <label>Color <span class="label-hint">selecciona uno</span></label>
            <div class="color-picker">
              <button type="button" *ngFor="let col of presetColors"
                      class="color-btn" [style.background]="col"
                      [class.selected]="form.color === col"
                      (click)="form.color = col"></button>
            </div>
          </div>

          <!-- Preview -->
          <div class="preview-box" *ngIf="form.name" [style.border-color]="form.color">
            <span class="preview-icon" [style.background]="(form.color ?? '#F4C430') + '22'">{{ form.icon }}</span>
            <span class="preview-name" [style.color]="form.color">{{ form.name }}</span>
          </div>

          <div class="form-group" *ngIf="editing">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" [(ngModel)]="form.active" name="active" style="width:auto" />
              Categoría activa
            </label>
          </div>

          <div class="error-msg-f" *ngIf="formError">⚠️ {{ formError }}</div>

          <div style="display:flex;gap:10px">
            <button type="submit" class="btn btn-primary" style="flex:1" [disabled]="saving">
              {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear') }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .cat-card {
      background: #16213e; border: 1px solid #252547; border-left-width: 4px;
      border-radius: 12px; padding: 18px; display: flex; align-items: flex-start; gap: 14px;
      transition: all 0.2s;
    }
    .cat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .cat-icon {
      width: 56px; height: 56px; border-radius: 12px; border: 1px solid;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cat-info { flex: 1; }
    .cat-name { font-weight: 700; font-size: 16px; color: #f0f0ff; }
    .cat-desc { font-size: 12px; margin-top: 4px; }
    .cat-actions { display: flex; flex-direction: column; gap: 6px; }
    .btn-sm { padding: 6px 10px; font-size: 12px; }

    /* Icon picker */
    .icon-picker { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .icon-btn {
      width: 38px; height: 38px; border-radius: 8px; border: 1px solid #252547;
      background: #0f0f1a; font-size: 18px; cursor: pointer; transition: all 0.15s;
    }
    .icon-btn.selected, .icon-btn:hover { border-color: #F4C430; background: rgba(244,196,48,0.1); }

    /* Color picker */
    .color-picker { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .color-btn {
      width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent;
      cursor: pointer; transition: all 0.15s;
    }
    .color-btn.selected { border-color: #fff; transform: scale(1.2); }

    /* Preview */
    .preview-box {
      display: flex; align-items: center; gap: 12px;
      background: #0f0f1a; border: 1px solid; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 16px;
    }
    .preview-icon { font-size: 24px; padding: 6px; border-radius: 8px; }
    .preview-name { font-weight: 700; font-size: 16px; }

    .label-hint { color: #a0a0c0; font-weight: 400; font-size: 11px; }
    .error-msg-f {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
      border-radius: 8px; padding: 10px 14px; color: #ef4444;
      font-size: 13px; margin-bottom: 12px;
    }
    .empty-state { text-align: center; padding: 48px 24px; }
  `]
})
export class AdminCategoriesComponent implements OnInit {
    categories: Category[] = [];
    loading = true;
    showModal = false;
    editing: Category | null = null;
    saving = false;
    formError = '';

    presetIcons = PRESET_ICONS;
    presetColors = PRESET_COLORS;

    form: Partial<Category> = this.emptyForm();

    constructor(private catSvc: CategoryService) { }
    ngOnInit() { this.load(); }

    load() {
        this.loading = true;
        this.catSvc.getAllAdmin().subscribe({
            next: (r: any) => { this.categories = r.data ?? []; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    emptyForm(): Partial<Category> {
        return { name: '', description: '', icon: '📦', color: '#F4C430', active: true };
    }

    openModal(c?: Category) {
        this.editing = c ?? null;
        this.form = c ? { ...c } : this.emptyForm();
        this.formError = '';
        this.showModal = true;
    }

    closeModal() { this.showModal = false; this.editing = null; }

    save() {
        if (!this.form.name?.trim()) { this.formError = 'El nombre es obligatorio.'; return; }
        this.saving = true;
        this.formError = '';
        const obs = this.editing
            ? this.catSvc.update(this.editing._id!, this.form)
            : this.catSvc.create(this.form);

        obs.subscribe({
            next: () => { this.saving = false; this.closeModal(); this.load(); },
            error: (e: any) => { this.saving = false; this.formError = e.error?.message ?? 'Error al guardar.'; }
        });
    }

    deleteCategory(c: Category) {
        if (!confirm(`¿Eliminar categoría "${c.name}"?`)) return;
        this.catSvc.delete(c._id!).subscribe({ next: () => this.load() });
    }
}
