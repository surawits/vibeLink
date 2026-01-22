import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for loading to finish
  if (authService.isLoading()) {
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (!authService.isLoading()) {
                clearInterval(interval);
                resolve(true);
            }
        }, 50);
    });
  }

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Redirect to home if authenticated but not admin, or login if not auth
  if (authService.isAuthenticated()) {
      router.navigate(['/']);
  } else {
      router.navigate(['/login']);
  }
  
  return false;
};
