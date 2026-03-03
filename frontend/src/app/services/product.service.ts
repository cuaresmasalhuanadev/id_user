import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Product {
    _id?: string;
    name: string;
    description: string;
    price: number;               // precio base SIN IGV
    category: string;
    imageUrl: string;
    stock: number;
    active: boolean;
    coupon?: string;             // código cupón → 15% off
    tipoDuracion?: 'NINGUNO' | 'MES' | 'ANUAL';
    createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
    private url = `${environment.apiUrl}/products`;

    constructor(private http: HttpClient, private auth: AuthService) { }

    private headers(): HttpHeaders {
        return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
    }

    // Public - no auth needed
    getActive(): Observable<any> {
        return this.http.get<any>(this.url);
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.url}/${id}`);
    }

    // Admin only
    getAll(): Observable<any> {
        return this.http.get<any>(`${this.url}/admin/all`, { headers: this.headers() });
    }

    create(product: Partial<Product>): Observable<any> {
        return this.http.post<any>(this.url, product, { headers: this.headers() });
    }

    update(id: string, product: Partial<Product>): Observable<any> {
        return this.http.put<any>(`${this.url}/${id}`, product, { headers: this.headers() });
    }

    delete(id: string): Observable<any> {
        return this.http.delete<any>(`${this.url}/${id}`, { headers: this.headers() });
    }
}
