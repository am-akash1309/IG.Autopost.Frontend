import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ApiService } from './services/api.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const apiService = inject(ApiService);
    const router = inject(Router);

    if (apiService.isLoggedIn()) {
        if (apiService.isAdmin()) {
            return true;
        }
        // If logged in but not admin, redirect to home
        router.navigate(['/']);
        return false;
    }

    // If not logged in, redirect to login
    router.navigate(['/login']);
    return false;
};
