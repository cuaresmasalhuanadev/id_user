import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginPayload {
    email: string;
    whatsapp: string;
    referralCode: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    expiresIn: number;
    admin: { id: string; email: string; whatsapp: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'bfs_token';
    private readonly ADMIN_KEY = 'bfs_admin';
    private isLoggedIn$ = new BehaviorSubject<boolean>(this.isAuthenticated());

    constructor(private http: HttpClient) { }

    login(payload: LoginPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
            tap(res => {
                if (res.success) {
                    localStorage.setItem(this.TOKEN_KEY, res.token);
                    localStorage.setItem(this.ADMIN_KEY, JSON.stringify(res.admin));
                    this.isLoggedIn$.next(true);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ADMIN_KEY);
        this.isLoggedIn$.next(false);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getAdmin(): any {
        const admin = localStorage.getItem(this.ADMIN_KEY);
        return admin ? JSON.parse(admin) : null;
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch {
            return false;
        }
    }

    get isLoggedIn(): Observable<boolean> {
        return this.isLoggedIn$.asObservable();
    }
}
