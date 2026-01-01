import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    username: string = '';
    otp: string = '';
    loading: boolean = false;
    error: string | null = null;

    constructor(private apiService: ApiService, private router: Router) {
        // Redirect if already logged in
        if (this.apiService.isLoggedIn()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onLogin() {
        this.loading = true;
        this.error = null;

        // Clean username (remove @ if present)
        const cleanUsername = this.username.startsWith('@') ? this.username.substring(1) : this.username;

        this.apiService.verifyOtp(cleanUsername, this.otp).subscribe({
            next: (response) => {
                this.loading = false;
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.detail || 'Invalid OTP or username. Please try again.';
            }
        });
    }

    openMagicLink(event: MouseEvent) {
        event.preventDefault();
        const username = 'coimbatore_pet_adoption';
        const webUrl = `https://ig.me/m/${username}`;

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isAndroid = /android/i.test(userAgent);
        const isIos = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

        if (isAndroid) {
            // Android Intent - Most reliable for Chrome/Samsung Internet to force app opening
            // This specifically targets the Instagram package
            const intentUrl = `intent://ig.me/m/${username}#Intent;package=com.instagram.android;scheme=https;end`;
            window.location.href = intentUrl;

            // Fallback for cases where intent might fail after a short delay
            setTimeout(() => {
                window.location.href = webUrl;
            }, 500);
        } else if (isIos) {
            // iOS handles https://ig.me/m/ well as a Universal Link
            window.location.href = webUrl;
        } else {
            // Desktop
            window.open(webUrl, '_blank');
        }
    }
}
