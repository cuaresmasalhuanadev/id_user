import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Category {
    _id?: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private base = `${environment.apiUrl}/categories`;

    private get headers() {
        const token = localStorage.getItem('bfs_token');
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    constructor(private http: HttpClient) { }

    getAll() { return this.http.get(`${this.base}`); }
    getAllAdmin() { return this.http.get(`${this.base}/admin/all`, { headers: this.headers }); }
    create(data: Partial<Category>) { return this.http.post(this.base, data, { headers: this.headers }); }
    update(id: string, data: Partial<Category>) { return this.http.put(`${this.base}/${id}`, data, { headers: this.headers }); }
    delete(id: string) { return this.http.delete(`${this.base}/${id}`, { headers: this.headers }); }
}
