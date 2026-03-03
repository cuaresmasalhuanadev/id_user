import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService, Product } from '../../services/product.service';
import { environment } from '../../../environments/environment';

const IGV = 0.18;
const DESCUENTO = 0.15;
const PAGE_URL = 'https://www.biegsfritsstore.shop';
const WA_NUMBER = '51917360503';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- NAV -->
    <nav class="store-nav">
      <div class="nav-inner">
        <div class="brand" (click)="scrollTop()">
          <span class="brand-icon">🛒</span>
          <span class="brand-name">Biegs Frits Store</span>
        </div>
        <div class="nav-right">
          <input class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="filterProducts()"
                 placeholder="🔍 Buscar productos..." />
          <button class="btn-theme" (click)="toggleTheme()" [title]="isDark ? 'Modo día' : 'Modo noche'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <button class="btn-reniec" (click)="openReniec()">🪪 RENIEC</button>
          <button class="btn-admin" (click)="goAdmin()">Admin</button>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-content">
        <p class="hero-tag">🇵🇪 Biegs Frits Store — Lima, Perú</p>
        <h1 class="hero-title">Los mejores productos<br/><span class="text-gold">a tu alcance</span></h1>
        <p class="hero-sub">Precios con IGV incluido · Calidad garantizada · Atención personalizada</p>
      </div>
    </section>

    <!-- CATEGORIES -->
    <div class="categories-bar" *ngIf="categories.length > 0">
      <div class="categories-inner">
        <button class="cat-btn" [class.active]="activeCategory === 'all'" (click)="filterByCategory('all')">Todos</button>
        <button class="cat-btn" *ngFor="let cat of categories"
                [class.active]="activeCategory === cat" (click)="filterByCategory(cat)">{{ cat }}</button>
      </div>
    </div>

    <!-- PRODUCTS -->
    <main class="store-main">
      <div *ngIf="loading" class="loading-grid">
        <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]"></div>
      </div>
      <div *ngIf="!loading && filtered.length === 0" class="empty-state">
        <div style="font-size:64px">🗂️</div>
        <h3>No hay productos disponibles</h3>
        <p class="text-muted">Vuelve pronto, estamos cargando el catálogo.</p>
      </div>
      <div class="products-grid" *ngIf="!loading && filtered.length > 0">
        <div class="product-card" *ngFor="let p of filtered">
          <div class="product-img">
            <img [src]="p.imageUrl || 'https://placehold.co/400x300/1a1a2e/F4C430?text=' + encode(p.name)"
                 [alt]="p.name" loading="lazy" />
            <div class="badges-top">
              <span class="badge badge-info"  *ngIf="p.tipoDuracion === 'MES'">📅 Mensual</span>
              <span class="badge badge-gold"  *ngIf="p.tipoDuracion === 'ANUAL'">🗓️ Anual</span>
              <span class="badge badge-success" *ngIf="p.coupon">🎫 Cupón disponible</span>
            </div>
            <span class="product-badge badge badge-gold"   *ngIf="p.stock <= 5 && p.stock > 0">¡Últimas unidades!</span>
            <span class="product-badge badge badge-danger" *ngIf="p.stock === 0">Agotado</span>
          </div>
          <div class="product-body">
            <span class="product-cat text-muted">{{ p.category }}</span>
            <h3 class="product-name">{{ p.name }}</h3>
            <p class="product-desc text-muted">{{ (p.description || '') | slice:0:80 }}{{ (p.description || '').length > 80 ? '...' : '' }}</p>
            <div class="price-box">
              <div class="price-row-s">
                <span class="price-lbl">Precio c/IGV</span>
                <span class="price-val">S/ {{ igv(p.price) | number:'1.2-2' }}</span>
              </div>
              <div class="price-row-s" *ngIf="p.tipoDuracion === 'ANUAL'">
                <span class="price-lbl text-gold">Anual (×12)</span>
                <span class="price-val-a">S/ {{ anual(p.price) | number:'1.2-2' }}</span>
              </div>
            </div>
            <button class="btn-detail" [disabled]="p.stock === 0" (click)="openDetail(p)">
              {{ p.stock === 0 ? 'Agotado' : 'Ver detalles →' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ══════════════════════════════════════════════════════
         DETAIL MODAL — 3 steps: Info → ¿Cupón? → WhatsApp
    ══════════════════════════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="selected" (click)="closeDetail()">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-hdr">
          <h3>{{ selected.name }}</h3>
          <button class="close-btn" (click)="closeDetail()">✕</button>
        </div>

        <!-- STEP 1: product info -->
        <div *ngIf="step === 1" class="step-content">
          <img [src]="selected.imageUrl || 'https://placehold.co/600x300/1a1a2e/F4C430?text=' + encode(selected.name)"
               [alt]="selected.name" class="detail-img" />
          <div class="detail-badges">
            <span class="badge badge-gold">{{ selected.category }}</span>
            <span class="badge badge-info"     *ngIf="selected.tipoDuracion === 'MES'">📅 Plan Mensual</span>
            <span class="badge badge-gold"     *ngIf="selected.tipoDuracion === 'ANUAL'">🗓️ Plan Anual</span>
            <span class="badge badge-success"  *ngIf="selected.stock > 0">Stock: {{ selected.stock }}</span>
            <span class="badge badge-danger"   *ngIf="selected.stock === 0">Agotado</span>
          </div>
          <p class="detail-desc">{{ selected.description }}</p>
          <!-- Price table -->
          <div class="price-tbl">
            <div class="pt-r">
              <span>Precio base (sin IGV)</span>
              <span>S/ {{ selected.price | number:'1.2-2' }}</span>
            </div>
            <div class="pt-r pt-igv">
              <span>IGV (18%)</span>
              <span>+ S/ {{ igvOf(selected.price) | number:'1.2-2' }}</span>
            </div>
            <div class="pt-r pt-tot">
              <span>💰 Precio final<span *ngIf="selected.tipoDuracion === 'MES'"> /mes</span></span>
              <span class="text-gold">S/ {{ igv(selected.price) | number:'1.2-2' }}</span>
            </div>
            <div class="pt-r pt-anual" *ngIf="selected.tipoDuracion === 'ANUAL'">
              <span>🗓️ Pago anual (×12)</span>
              <span class="text-gold" style="font-size:1.1em;font-weight:800">S/ {{ anual(selected.price) | number:'1.2-2' }}</span>
            </div>
          </div>
          <button class="btn-primary-f" (click)="goStep2()" [disabled]="selected.stock === 0">
            Continuar para pedir 💬
          </button>
        </div>

        <!-- STEP 2: ¿Tienes cupón? -->
        <div *ngIf="step === 2" class="step-content">
          <div class="coupon-question" *ngIf="!couponDecided">
            <div class="coupon-q-icon">🎫</div>
            <h4>¿Tienes un código de descuento?</h4>
            <p class="text-muted" style="font-size:13px">Si tienes un cupón, te aplicamos un <strong class="text-gold">15% de descuento</strong> sobre el precio final.</p>
            <div style="display:flex;gap:12px;margin-top:20px">
              <button class="btn-choice yes" (click)="decideCoupon(true)">✅ Sí, tengo</button>
              <button class="btn-choice no"  (click)="decideCoupon(false)">❌ No, continuar</button>
            </div>
          </div>

          <div class="coupon-entry" *ngIf="couponDecided && wantsCoupon">
            <div class="coupon-q-icon">🎫</div>
            <h4>Ingresa tu código</h4>
            <div class="coupon-row">
              <input type="text" class="coupon-inp" [(ngModel)]="couponInput"
                     (ngModelChange)="couponInput = couponInput.toUpperCase()"
                     [class.valid]="couponApplied" [class.invalid]="couponError"
                     placeholder="CÓDIGO DE CUPÓN" />
              <button class="btn-apply" (click)="applyCoupon()">Aplicar</button>
            </div>
            <p class="coupon-ok"  *ngIf="couponApplied">✅ ¡Cupón aplicado! Descuento del 15%</p>
            <p class="coupon-err" *ngIf="couponError">❌ Código incorrecto, verifica e intenta de nuevo.</p>

            <div class="price-tbl" *ngIf="couponApplied" style="margin-top:16px">
              <div class="pt-r pt-tot">
                <span>Precio sin descuento</span>
                <span style="text-decoration:line-through;color:#a0a0c0">S/ {{ igv(selected!.price) | number:'1.2-2' }}</span>
              </div>
              <div class="pt-r" style="color:#22c55e;font-weight:700">
                <span>💰 Con descuento (−15%)</span>
                <span>S/ {{ conDescuento(selected!.price) | number:'1.2-2' }}</span>
              </div>
            </div>

            <div style="display:flex;gap:10px;margin-top:16px">
              <button class="btn-primary-f" (click)="sendWhatsApp()" [disabled]="!couponApplied">
                💬 Enviar por WhatsApp
              </button>
              <button class="btn-secondary-f" (click)="couponDecided = false; couponError = false; couponApplied = false">
                ← Atrás
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         RENIEC MODAL — public DNI lookup
    ══════════════════════════════════════════════ -->
    <div class="modal-overlay" *ngIf="reniecOpen" (click)="closeReniec()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-hdr">
          <div>
            <h3>🪪 Consulta DNI — RENIEC</h3>
            <p class="text-muted" style="font-size:12px;margin-top:2px">Verifica tu identidad</p>
          </div>
          <button class="close-btn" (click)="closeReniec()">✕</button>
        </div>
        <div class="step-content">
          <!-- Provider selector -->
          <div class="rprov-label">Selecciona dónde consultar:</div>
          <div class="rprov-tabs">
            <button class="rprov-btn" [class.active]="reniecProv==='perudevs'" (click)="reniecProv='perudevs'; reniecResult=null; reniecError=''">
              <span class="rprov-ico">🔶</span>
              <div>
                <strong>PeruDevs</strong>
                <small>Nombre, apellidos, sexo, fecha nac.</small>
              </div>
            </button>
            <button class="rprov-btn" [class.active]="reniecProv==='decolecta'" (click)="reniecProv='decolecta'; reniecResult=null; reniecError=''">
              <span class="rprov-ico">🔷</span>
              <div>
                <strong>Decolecta</strong>
                <small>Nombre y apellidos</small>
              </div>
            </button>
          </div>

          <!-- DNI input -->
          <div class="reniec-input-wrap">
            <span class="dni-flag2">🇵🇪</span>
            <input type="text" class="reniec-inp" [(ngModel)]="reniecDni"
                   maxlength="8" placeholder="Ingresa tu DNI (8 dígitos)"
                   (ngModelChange)="onReniecDni($event)"
                   (keyup.enter)="consultarReniec()" />
            <span class="r-counter" [class.rfull]="reniecDni.length===8">{{ reniecDni.length }}/8</span>
          </div>

          <button class="btn-primary-f" (click)="consultarReniec()"
                  [disabled]="reniecDni.length!==8 || reniecLoading" style="margin-top:10px">
            {{ reniecLoading ? '⏳ Consultando...' : '🔎 Consultar DNI' }}
          </button>

          <!-- Error -->
          <div class="query-error" *ngIf="reniecError" style="margin-top:12px">
            ⚠️ {{ reniecError }}
          </div>

          <!-- Result -->
          <div class="result-card" *ngIf="reniecResult" style="margin-top:16px">
            <div class="result-header">
              <div class="result-avatar">{{ reniecInitials() }}</div>
              <div>
                <h4 class="result-name-r">{{ reniecResult.nombre_completo }}</h4>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
                  <span class="badge badge-success">✅ Verificado RENIEC</span>
                  <span class="badge badge-info" *ngIf="reniecProvider === 'perudevs'" style="margin-left:4px">🔶 PeruDevs</span>
                  <span class="badge badge-gold" *ngIf="reniecProvider === 'decolecta'" style="margin-left:4px">🔷 Decolecta</span>
                </div>
              </div>
            </div>
            <div class="result-grid" style="grid-template-columns:1fr 1fr;gap:8px">
              <div class="result-field">
                <span class="rf-label">📋 DNI</span>
                <span class="rf-value" style="font-family:monospace">{{ reniecResult.document_number }}</span>
              </div>
              <div class="result-field" *ngIf="reniecResult.genero">
                <span class="rf-label">⚧ Sexo</span>
                <span class="rf-value">{{ reniecResult.genero === 'M' ? '👨 Masc.' : '👩 Fem.' }}</span>
              </div>
              <div class="result-field">
                <span class="rf-label">👤 Nombres</span>
                <span class="rf-value">{{ reniecResult.nombres }}</span>
              </div>
              <div class="result-field" *ngIf="reniecResult.fecha_nacimiento">
                <span class="rf-label">🎂 F. Nacimiento</span>
                <span class="rf-value">{{ reniecResult.fecha_nacimiento }}</span>
              </div>
              <div class="result-field" style="grid-column:1/-1">
                <span class="rf-label">👨‍👩‍👧 Apellidos</span>
                <span class="rf-value">{{ reniecResult.apellido_paterno }} {{ reniecResult.apellido_materno }}</span>
              </div>
            </div>
            <button class="btn-secondary-f" (click)="reniecDni=''; reniecResult=null; reniecError=''" style="margin-top:12px">
              🔄 Nueva consulta
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="store-footer">
      <p>© 2026 <strong class="text-gold">Biegs Frits Store</strong> · Lima, Perú 🇵🇪</p>
      <p class="text-muted" style="font-size:12px">biegsfritsstore&#64;gmail.com</p>
    </footer>
  `,
  styles: [`
    /* === NAV === */
    .store-nav { background: rgba(15,15,26,0.96); border-bottom:1px solid #252547; position:sticky; top:0; z-index:100; backdrop-filter:blur(12px); }
    .nav-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:14px 24px; gap:16px; }
    .brand { display:flex; align-items:center; gap:10px; cursor:pointer; }
    .brand-icon { font-size:24px; }
    .brand-name { font-family:'Poppins',sans-serif; font-weight:700; font-size:18px; color:#F4C430; }
    .nav-right { display:flex; align-items:center; gap:12px; }
    .search-input { background:#1a1a2e; border:1px solid #252547; border-radius:8px; color:#f0f0ff; padding:9px 14px; font-size:14px; outline:none; width:240px; transition:border-color 0.2s; }
    .search-input:focus { border-color:#F4C430; }
    .btn-admin { background:transparent; border:1px solid var(--bg-border); border-radius:8px; color:var(--text-secondary); padding:8px 14px; font-size:13px; cursor:pointer; transition:all 0.2s; }
    .btn-admin:hover { border-color:var(--gold); color:var(--gold); }
    .btn-theme { background:transparent; border:1px solid var(--bg-border); border-radius:8px; padding:7px 11px; font-size:16px; cursor:pointer; transition:all 0.2s; }
    .btn-theme:hover { border-color:var(--gold); transform:scale(1.1); }
    .btn-reniec { background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.4); border-radius:8px; color:#60a5fa; padding:8px 13px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .btn-reniec:hover { background:rgba(59,130,246,0.2); border-color:#3b82f6; }
    /* RENIEC provider selector */
    .rprov-label { font-size:11px; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.8px; margin-bottom:8px; }
    .rprov-tabs { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
    .rprov-btn { display:flex; align-items:center; gap:10px; padding:12px; background:var(--bg-secondary); border:1px solid var(--bg-border); border-radius:10px; cursor:pointer; text-align:left; transition:all 0.2s; }
    .rprov-btn.active { border-color:#3b82f6; background:rgba(59,130,246,0.08); }
    .rprov-btn strong { display:block; color:var(--text-primary); font-size:13px; }
    .rprov-btn small { display:block; color:var(--text-secondary); font-size:11px; margin-top:2px; }
    .rprov-ico { font-size:24px; flex-shrink:0; }
    /* RENIEC modal input */
    .reniec-input-wrap { display:flex; align-items:center; gap:10px; background:var(--bg-secondary); border:2px solid var(--bg-border); border-radius:10px; padding:0 16px; transition:border-color 0.2s; }
    .reniec-input-wrap:focus-within { border-color:#3b82f6; }
    .dni-flag2 { font-size:22px; }
    .reniec-inp { flex:1; background:transparent; border:none; outline:none; color:var(--text-primary); font-size:22px; font-family:monospace; font-weight:700; letter-spacing:4px; padding:14px 0; }
    .reniec-inp::placeholder { font-size:13px; letter-spacing:0; font-weight:400; color:var(--text-secondary); }
    .r-counter { font-size:11px; color:var(--text-secondary); white-space:nowrap; }
    .r-counter.rfull { color:#3b82f6; font-weight:700; }
    /* RENIEC result card */
    .result-card { margin-top:16px; padding:18px; background:var(--bg-secondary); border:1px solid rgba(34,197,94,0.25); border-radius:12px; animation:slideUp 0.3s ease; }
    .result-header { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
    .result-avatar { width:56px; height:56px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#F4C430,#d4a017); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:#000; }
    .result-name-r { font-size:15px; font-weight:800; color:var(--text-primary); margin-bottom:4px; }
    .result-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .result-field { background:var(--bg); border:1px solid var(--bg-border); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:3px; }
    .result-field.full { grid-column:1/-1; }
    .rf-label { font-size:10px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.7px; }
    .rf-value { font-size:14px; color:var(--text-primary); font-weight:700; }
    .query-error { padding:10px 14px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:#ef4444; font-size:13px; }

    /* === HERO === */
    .hero { background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%); border-bottom:1px solid #252547; padding:64px 24px; text-align:center; }
    .hero-tag { color:#F4C430; font-size:13px; font-weight:600; letter-spacing:1px; margin-bottom:12px; }
    .hero-title { font-size:clamp(28px,5vw,52px); color:#f0f0ff; margin-bottom:16px; }
    .hero-sub { color:#a0a0c0; font-size:15px; }

    /* === CATEGORIES === */
    .categories-bar { background:#1a1a2e; border-bottom:1px solid #252547; padding:14px 24px; }
    .categories-inner { max-width:1200px; margin:0 auto; display:flex; flex-wrap:wrap; gap:8px; }
    .cat-btn { background:#16213e; border:1px solid #252547; border-radius:20px; color:#a0a0c0; padding:6px 16px; font-size:13px; cursor:pointer; transition:all 0.2s; }
    .cat-btn.active,.cat-btn:hover { background:#F4C430; color:#000; border-color:#F4C430; font-weight:600; }

    /* === MAIN / GRID === */
    .store-main { max-width:1200px; margin:0 auto; padding:32px 24px; }
    .loading-grid,.products-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:24px; }
    .skeleton-card { height:420px; background:#16213e; border-radius:12px; animation:shimmer 1.5s ease infinite; }
    .empty-state { text-align:center; padding:80px 20px; }
    .empty-state h3 { font-size:22px; margin-bottom:8px; }

    /* === PRODUCT CARD === */
    .product-card { background:#16213e; border:1px solid #252547; border-radius:12px; overflow:hidden; transition:all 0.25s; display:flex; flex-direction:column; }
    .product-card:hover { transform:translateY(-6px); border-color:#F4C430; box-shadow:0 12px 40px rgba(0,0,0,0.4); }
    .product-img { position:relative; height:200px; overflow:hidden; background:#0f0f1a; flex-shrink:0; }
    .product-img img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
    .product-card:hover .product-img img { transform:scale(1.05); }
    .badges-top { position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:4px; }
    .product-badge { position:absolute; top:10px; right:10px; }
    .product-body { padding:18px; display:flex; flex-direction:column; gap:8px; flex:1; }
    .product-cat { font-size:11px; text-transform:uppercase; letter-spacing:0.8px; }
    .product-name { font-size:16px; font-weight:700; color:#f0f0ff; margin:0; }
    .product-desc { font-size:13px; line-height:1.5; flex:1; color:#a0a0c0; }
    .price-box { background:#0f0f1a; border-radius:8px; padding:10px 14px; }
    .price-row-s { display:flex; justify-content:space-between; align-items:center; }
    .price-lbl { font-size:11px; color:#a0a0c0; text-transform:uppercase; }
    .price-val { font-size:20px; font-weight:800; color:#F4C430; }
    .price-val-a { font-size:14px; font-weight:700; color:#F4C430; }
    .btn-detail { background:linear-gradient(135deg,#F4C430,#d4a017); color:#000; font-weight:700; border:none; border-radius:8px; padding:11px; cursor:pointer; font-size:14px; transition:all 0.2s; }
    .btn-detail:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(244,196,48,0.3); }
    .btn-detail:disabled { opacity:0.4; cursor:not-allowed; }

    /* === MODAL === */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:200; padding:16px; backdrop-filter:blur(4px); }
    .modal-box { background:var(--bg-secondary); border:1px solid var(--bg-border); border-radius:16px; width:min(560px,100%); max-height:88vh; overflow-y:auto; }
    .modal-hdr { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid var(--bg-border); position:sticky; top:0; background:var(--bg-secondary); z-index:1; }
    .modal-hdr h3 { font-size:17px; color:var(--text-primary); font-weight:700; margin:0; }
    .close-btn { background:none; border:none; color:var(--text-secondary); font-size:20px; cursor:pointer; padding:4px 8px; border-radius:6px; transition:all 0.2s; }
    .close-btn:hover { color:var(--text-primary); background:var(--bg-border); }
    .step-content { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .detail-img { width:100%; max-height:220px; object-fit:cover; border-radius:10px; }
    .detail-badges { display:flex; flex-wrap:wrap; gap:6px; }
    .detail-desc { color:var(--text-secondary); font-size:14px; line-height:1.6; }

    /* Price table */
    .price-tbl { background:var(--bg); border:1px solid var(--bg-border); border-radius:8px; overflow:hidden; }
    .pt-r { display:flex; justify-content:space-between; padding:9px 14px; font-size:13px; color:var(--text-secondary); border-bottom:1px solid rgba(37,37,71,0.4); }
    .pt-igv { }
    .pt-tot { color:var(--text-primary); font-weight:700; background:rgba(244,196,48,0.05); border-bottom:none; }
    .pt-anual { color:var(--text-primary); background:rgba(244,196,48,0.08); border-bottom:none; }

    /* Buttons */
    .btn-primary-f { background:linear-gradient(135deg,#F4C430,#d4a017); color:#000; font-weight:700; border:none; border-radius:10px; padding:13px; cursor:pointer; font-size:15px; transition:all 0.2s; width:100%; }
    .btn-primary-f:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(244,196,48,0.3); }
    .btn-primary-f:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-secondary-f { background:#16213e; border:1px solid #252547; color:#a0a0c0; border-radius:10px; padding:13px; cursor:pointer; font-size:14px; width:100%; }
    .btn-secondary-f:hover { border-color:#F4C430; color:#f0f0ff; }

    /* Coupon question */
    .coupon-question { text-align:center; padding:8px 0; }
    .coupon-q-icon { font-size:48px; margin-bottom:12px; }
    .coupon-question h4 { font-size:18px; color:var(--text-primary); margin-bottom:8px; }
    .btn-choice { flex:1; padding:14px; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; border:1px solid; transition:all 0.2s; }
    .btn-choice.yes { background:rgba(34,197,94,0.1); border-color:#22c55e; color:#22c55e; }
    .btn-choice.yes:hover { background:#22c55e; color:#000; }
    .btn-choice.no { background:rgba(239,68,68,0.1); border-color:#ef4444; color:#ef4444; }
    .btn-choice.no:hover { background:#ef4444; color:#fff; }
    .coupon-entry h4 { font-size:16px; color:var(--text-primary); margin-bottom:12px; text-align:center; }
    .coupon-row { display:flex; gap:8px; }
    .coupon-inp { flex:1; background:var(--bg); border:1px solid var(--bg-border); border-radius:8px; color:var(--text-primary); padding:11px 14px; font-family:monospace; font-size:14px; text-transform:uppercase; outline:none; transition:all 0.2s; }
    .coupon-inp:focus { border-color:#F4C430; }
    .coupon-inp.valid { border-color:#22c55e; background:rgba(34,197,94,0.05); }
    .coupon-inp.invalid { border-color:#ef4444; }
    .btn-apply { background:#F4C430; color:#000; font-weight:700; border:none; border-radius:8px; padding:0 18px; cursor:pointer; font-size:14px; flex-shrink:0; }
    .coupon-ok { color:#22c55e; font-size:13px; font-weight:600; margin-top:6px; }
    .coupon-err { color:#ef4444; font-size:13px; margin-top:6px; }
    /* Store footer */
    .store-footer { text-align:center; padding:32px 24px; border-top:1px solid var(--bg-border); margin-top:40px; }
    .btn-choice { flex:1; padding:14px; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; border:1px solid; transition:all 0.2s; }
    .btn-choice.yes { background:rgba(34,197,94,0.1); border-color:#22c55e; color:#22c55e; }
    .btn-choice.yes:hover { background:#22c55e; color:#000; }
    .btn-choice.no { background:rgba(239,68,68,0.1); border-color:#ef4444; color:#ef4444; }
    .btn-choice.no:hover { background:#ef4444; color:#fff; }

    .coupon-entry h4 { font-size:16px; color:#f0f0ff; margin-bottom:12px; text-align:center; }
    .coupon-row { display:flex; gap:8px; }
    .coupon-inp { flex:1; background:#0f0f1a; border:1px solid #252547; border-radius:8px; color:#f0f0ff; padding:11px 14px; font-family:monospace; font-size:14px; text-transform:uppercase; outline:none; transition:all 0.2s; }
    .coupon-inp:focus { border-color:#F4C430; }
    .coupon-inp.valid { border-color:#22c55e; background:rgba(34,197,94,0.05); }
    .coupon-inp.invalid { border-color:#ef4444; }
    .btn-apply { background:#F4C430; color:#000; font-weight:700; border:none; border-radius:8px; padding:0 18px; cursor:pointer; font-size:14px; flex-shrink:0; }
    .coupon-ok { color:#22c55e; font-size:13px; font-weight:600; margin-top:6px; }
    .coupon-err { color:#ef4444; font-size:13px; margin-top:6px; }

    /* Footer */
    .store-footer { text-align:center; padding:32px 24px; border-top:1px solid #252547; margin-top:40px; }

    @media (max-width:600px) {
      .nav-right { flex-direction:column; align-items:stretch; }
      .search-input { width:100%; }
    }
  `]
})
export class StoreComponent implements OnInit {
  products: Product[] = [];
  filtered: Product[] = [];
  categories: string[] = [];
  loading = true;
  searchTerm = '';
  activeCategory = 'all';
  selected: Product | null = null;

  // Modal flow
  step = 1;                // 1 = product info, 2 = coupon question
  couponDecided = false;   // user chose yes or no
  wantsCoupon = false;     // user said yes
  couponInput = '';
  couponApplied = false;
  couponError = false;
  isDark = false;

  // RENIEC public modal
  reniecOpen = false;
  reniecDni = '';
  reniecLoading = false;
  reniecResult: any = null;
  reniecError = '';
  reniecProvider = '';
  reniecProv: 'perudevs' | 'decolecta' = 'perudevs';

  constructor(private productSvc: ProductService, private router: Router, private http: HttpClient) {
    // Default: day mode (light)
    const saved = localStorage.getItem('bfs_theme') ?? 'light';
    this.isDark = saved === 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const theme = this.isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bfs_theme', theme);
  }

  ngOnInit() {
    this.productSvc.getActive().subscribe({
      next: (res: any) => {
        this.products = res.data ?? [];
        this.categories = [...new Set(this.products.map((p: Product) => p.category).filter(Boolean))] as string[];
        this.filtered = [...this.products];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filterProducts() {
    const t = this.searchTerm.toLowerCase();
    this.filtered = this.products.filter(p =>
      (this.activeCategory === 'all' || p.category === this.activeCategory) &&
      (p.name.toLowerCase().includes(t) || (p.description || '').toLowerCase().includes(t))
    );
  }

  filterByCategory(cat: string) { this.activeCategory = cat; this.filterProducts(); }

  openDetail(p: Product) {
    this.selected = p;
    this.step = 1;
    this.couponDecided = false;
    this.wantsCoupon = false;
    this.couponInput = '';
    this.couponApplied = false;
    this.couponError = false;
  }

  closeDetail() { this.selected = null; }

  goStep2() { this.step = 2; }

  decideCoupon(wants: boolean) {
    this.wantsCoupon = wants;
    this.couponDecided = true;
    if (!wants) { this.sendWhatsApp(); }  // no coupon → send directly
  }

  applyCoupon() {
    const expected = (this.selected?.coupon ?? '').trim().toUpperCase();
    const entered = this.couponInput.trim().toUpperCase();
    if (expected && entered === expected) {
      this.couponApplied = true;
      this.couponError = false;
    } else {
      this.couponApplied = false;
      this.couponError = true;
    }
  }

  sendWhatsApp() {
    if (!this.selected) return;
    const p = this.selected;
    const dur = p.tipoDuracion === 'MES' ? 'Mensual' : p.tipoDuracion === 'ANUAL' ? 'Anual' : '';
    const precioFinal = this.igv(p.price);
    const descLine = this.couponApplied
      ? `\n🎫 Cupón (${this.couponInput}) → Precio con descuento: S/ ${this.conDescuento(p.price).toFixed(2)}`
      : '';
    const anualLine = p.tipoDuracion === 'ANUAL'
      ? `\n🗓️ Pago anual: S/ ${this.anual(p.price).toFixed(2)}`
      : '';

    const msg =
      `🛒 *Biegs Frits Store*
🔗 ${PAGE_URL}/tienda

Hola! Me interesa el siguiente producto:
📦 *${p.name}*
🏷️ Categoría: ${p.category || '—'}${dur ? '\n⏱️ Duración: ' + dur : ''}
💰 Precio c/IGV: S/ ${precioFinal.toFixed(2)}${anualLine}${descLine}
${p.description ? '\n📝 ' + p.description.slice(0, 100) : ''}

¿Cómo puedo proceder con la compra?`;

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    this.closeDetail();
  }

  scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  goAdmin() { this.router.navigate(['/admin/login']); }
  encode(s: string) { return encodeURIComponent(s); }

  // RENIEC
  openReniec() { this.reniecOpen = true; this.reniecDni = ''; this.reniecResult = null; this.reniecError = ''; this.reniecProvider = ''; this.reniecProv = 'perudevs'; }
  closeReniec() { this.reniecOpen = false; }
  onReniecDni(v: string) {
    this.reniecDni = v.replace(/[^0-9]/g, '').slice(0, 8);
    this.reniecResult = null;
    this.reniecError = '';
  }
  reniecInitials() {
    const r = this.reniecResult;
    return r ? (r.apellido_paterno?.[0] ?? '') + (r.nombres?.[0] ?? '') : '';
  }
  consultarReniec() {
    if (this.reniecDni.length !== 8 || this.reniecLoading) return;
    this.reniecLoading = true;
    this.reniecResult = null;
    this.reniecError = '';
    this.http.post<any>(`${environment.apiUrl}/reniec/public`, { dni: this.reniecDni, provider: this.reniecProv }).subscribe({
      next: (r) => { this.reniecLoading = false; this.reniecResult = r.data; this.reniecProvider = r.provider ?? ''; },
      error: (e) => { this.reniecLoading = false; this.reniecError = e.error?.message ?? 'Error al consultar.'; }
    });
  }

  igvOf(b: number) { return parseFloat((b * IGV).toFixed(2)); }
  igv(b: number) { return parseFloat((b * (1 + IGV)).toFixed(2)); }
  anual(b: number) { return parseFloat((this.igv(b) * 12).toFixed(2)); }
  conDescuento(b: number) { return parseFloat((this.igv(b) * (1 - DESCUENTO)).toFixed(2)); }
}
