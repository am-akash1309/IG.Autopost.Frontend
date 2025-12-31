import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ApiService } from './services/api.service';

export const authGuard: CanActivateFn = (route, state) => {
    const apiService = inject(ApiService);
    const router = inject(Router);

    if (apiService.isLoggedIn()) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};
