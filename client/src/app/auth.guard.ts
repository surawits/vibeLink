import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already authenticated, allow
  if (authService.isAuthenticated()) {
    return true;
  }

  // If not authenticated, check session first (might be loading)
  if (authService.isLoading()) {
    // Wait for session check to finish
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (!authService.isLoading()) {
                clearInterval(interval);
                resolve(true);
            }
        }, 50);
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login
  router.navigate(['/login']);
  return false;
};
