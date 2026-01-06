import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly BASE_URL = 'https://pet-adoption-api-6y2a.onrender.com/igautopostapi';
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(private http: HttpClient) { }

    private hasToken(): boolean {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(this.TOKEN_KEY);
            if (token) {
                // Simple check if token is expired (if it's a JWT)
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.exp && Date.now() >= payload.exp * 1000) {
                        this.logout();
                        return false;
                    }
                    return true;
                } catch (e) {
                    return true; // Not a JWT or malformed, but exists
                }
            }
        }
        return false;
    }

    verifyOtp(username: string, otp: string): Observable<any> {
        return this.http.post(`${this.BASE_URL}/auth/verify-otp`, { username, otp_code: otp }).pipe(
            tap((response: any) => {
                if (response && response.token) {
                    this.setToken(response.token);
                    this.setUser(response.user || { username });
                    this.isAuthenticatedSubject.next(true);
                }
            })
        );
    }

    private setToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(this.TOKEN_KEY);
        }
        return null;
    }

    private setUser(user: any): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
    }

    getUser(): any {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem(this.USER_KEY);
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    getUserRole(): string | null {
        const user = this.getUser();
        return user ? user.role : null;
    }

    isAdmin(): boolean {
        return this.getUserRole() === 'admin';
    }

    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
        }
        this.isAuthenticatedSubject.next(false);
    }

    isLoggedIn(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    uploadMedia(formData: FormData): Observable<any> {
        return this.http.post(`${this.BASE_URL}/media/upload`, formData);
    }

    getUserPosts(): Observable<any> {
        return this.http.get(`${this.BASE_URL}/media/posts`);
    }

    verifyAi(postId: string): Observable<any> {
        return this.http.post(`${this.BASE_URL}/media/verify-ai/${postId}`, {});
    }

    publishPost(postId: string): Observable<any> {
        return this.http.post(`${this.BASE_URL}/media/publish/${postId}`, {});
    }

    checkPostStatus(): Observable<any> {
        return this.http.get(`${this.BASE_URL}/media/check-status`);
    }

    getAdminStats(): Observable<any> {
        return this.http.get(`${this.BASE_URL}/admin/stats`);
    }

    getDailyStats(page: number = 1, limit: number = 10): Observable<any> {
        return this.http.get(`${this.BASE_URL}/admin/daily-stats?page=${page}&limit=${limit}`);
    }

    getPendingReviewPosts(): Observable<any> {
        return this.http.get(`${this.BASE_URL}/admin/pending-review`);
    }

    reviewPost(postId: string, isApproved: boolean): Observable<any> {
        return this.http.post(`${this.BASE_URL}/admin/review-post/${postId}`, { is_approved: isApproved });
    }
}

