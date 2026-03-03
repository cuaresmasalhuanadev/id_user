import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private base = `${environment.apiUrl}/config`;
    private reniecBase = `${environment.apiUrl}/reniec`;

    private get headers() {
        const token = localStorage.getItem('bfs_token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    constructor(private http: HttpClient) { }

    getAll() { return this.http.get(this.base, { headers: this.headers }); }
    upsert(key: string, value: string, label = '', notes = '') {
        return this.http.put(`${this.base}/${key}`, { value, label, notes }, { headers: this.headers });
    }

    // RENIEC
    consultarDni(dni: string, provider: 'perudevs' | 'decolecta' = 'perudevs') {
        return this.http.post(`${this.reniecBase}/consultar`, { dni, provider }, { headers: this.headers });
    }
    getTokenStatus() {
        return this.http.get(`${this.reniecBase}/token-status`, { headers: this.headers });
    }
}
