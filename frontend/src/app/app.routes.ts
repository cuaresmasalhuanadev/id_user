import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'tienda', pathMatch: 'full' },
    {
        path: 'tienda',
        loadComponent: () => import('./pages/store/store.component').then(m => m.StoreComponent)
    },
    {
        path: 'admin',
        children: [
            { path: '', redirectTo: 'login', pathMatch: 'full' },
            {
                path: 'login',
                loadComponent: () => import('./pages/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
            },
            {
                path: 'dashboard',
                canActivate: [authGuard],
                loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
                children: [
                    { path: '', redirectTo: 'productos', pathMatch: 'full' },
                    {
                        path: 'productos',
                        loadComponent: () => import('./pages/admin-products/admin-products.component').then(m => m.AdminProductsComponent)
                    },
                    {
                        path: 'boletas',
                        loadComponent: () => import('./pages/admin-boletas/admin-boletas.component').then(m => m.AdminBoletasComponent)
                    },
                    {
                        path: 'categorias',
                        loadComponent: () => import('./pages/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent)
                    },
                    {
                        path: 'reniec',
                        loadComponent: () => import('./pages/admin-reniec/admin-reniec.component').then(m => m.AdminReniecComponent)
                    }
                ]
            }
        ]
    },
    { path: '**', redirectTo: 'tienda' }
];
