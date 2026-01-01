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

        // Detection for mobile/tablet
        const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobileOrTablet) {
            // Using window.location.href instead of window.open often triggers App Links/Universal Links better on mobile
            // It allows the OS to intercept the URL and open the registered app.
            window.location.href = webUrl;
        } else {
            // On desktop, opening in a new tab is preferred
            window.open(webUrl, '_blank');
        }
    }
}
