import { Injectable, signal, computed, inject } from '@angular/core';
import { createAuthClient } from "better-auth/client";
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private client = createAuthClient({
    baseURL: environment.baseUrl
  });

  // State
  private session = signal<any>(null);
  private user = signal<any>(null);
  private fullProfile = signal<any>(null);
  private loading = signal<boolean>(true);

  // Selectors
  currentUser = computed(() => this.fullProfile() || this.user());
  isAuthenticated = computed(() => !!this.user());
  isLoading = computed(() => this.loading());
  isAdmin = computed(() => this.fullProfile()?.role === 'admin');
  mustChangePassword = computed(() => this.fullProfile()?.forceChangePassword);

  constructor() {
    this.checkSession();
  }

  async checkSession() {
    this.loading.set(true);
    try {
      const { data, error } = await this.client.getSession();
      if (data) {
        this.session.set(data.session);
        this.user.set(data.user);
        await this.fetchFullProfile();
      } else {
        this.session.set(null);
        this.user.set(null);
        this.fullProfile.set(null);
      }
    } catch (err) {
      console.error('[AuthService] Session check failed', err);
      this.session.set(null);
      this.user.set(null);
      this.fullProfile.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchFullProfile() {
    try {
      const res = await fetch(`${environment.baseUrl}/api/users/me`, {
        headers: {
            // Better Auth client handles headers automatically for its own calls, 
            // but for raw fetch we might need to ensure credentials are sent
        }
      });
      // Actually better-auth client uses hooks or local storage? 
      // It typically relies on cookies.
      // So simple fetch should work if credentials: 'include' is set or if same-origin.
      
      // Let's use the better-auth client's fetch or just standard fetch with credentials
      // Since we are likely on same domain (proxy) or CORS allowed with credentials.
      
      // But wait, the environment.baseUrl might be different port.
      // We need `credentials: 'include'` for CORS cookies.
      
      // Let's try standard fetch.
      // If it fails, we might need to use the client.request if available.
      
      // Check if `better-auth` client exposes a fetch wrapper.
      // It does `client.$fetch` in some versions, or we just use `fetch`.
      
      const response = await fetch(`${environment.baseUrl}/api/users/me`, {
         credentials: 'include'
      });
      
      if (response.ok) {
          const profile = await response.json();
          this.fullProfile.set(profile);
      }
    } catch (e) {
        console.error("Failed to fetch full profile", e);
    }
  }

  async login(email: string, password: string) {
    this.loading.set(true);
    try {
      const { data, error } = await this.client.signIn.email({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data) {
        const res = data as any;
        this.user.set(res.user);
        this.session.set(res.session || { token: res.token });
        await this.fetchFullProfile();
        return data;
      }
    } finally {
      this.loading.set(false);
    }
    return null;
  }

  async logout() {
    this.loading.set(true);
    try {
      await this.client.signOut();
      this.session.set(null);
      this.user.set(null);
      this.fullProfile.set(null);
      this.router.navigate(['/login']);
    } finally {
      this.loading.set(false);
    }
  }
}
