import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface BoletaItem {
    productId?: string;
    nombre: string;
    cantidad: number;
    precioUnit: number;
    subtotal?: number;
}

export interface Boleta {
    _id?: string;
    numero?: string;
    clienteNombre: string;
    clienteWhatsapp?: string;
    items: BoletaItem[];
    subtotal?: number;
    igv?: number;
    total?: number;
    emitidaEn?: string;
}

@Injectable({ providedIn: 'root' })
export class BoletaService {
    private url = `${environment.apiUrl}/boletas`;

    constructor(private http: HttpClient, private auth: AuthService) { }

    private headers(): HttpHeaders {
        return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
    }

    getAll(): Observable<any> {
        return this.http.get<any>(this.url, { headers: this.headers() });
    }

    getById(id: string): Observable<any> {
        return this.http.get<any>(`${this.url}/${id}`, { headers: this.headers() });
    }

    create(boleta: Partial<Boleta>): Observable<any> {
        return this.http.post<any>(this.url, boleta, { headers: this.headers() });
    }

    delete(id: string): Observable<any> {
        return this.http.delete<any>(`${this.url}/${id}`, { headers: this.headers() });
    }

    getPdfUrl(id: string): string {
        return `${this.url}/${id}/pdf`;
    }

    downloadPdf(id: string): void {
        const token = this.auth.getToken();
        fetch(`${this.url}/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `boleta-${id}.pdf`;
                a.click();
            });
    }
}
