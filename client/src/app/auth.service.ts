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
  private loading = signal<boolean>(true);

  // Selectors
  currentUser = computed(() => this.user());
  isAuthenticated = computed(() => !!this.user());
  isLoading = computed(() => this.loading());

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
      } else {
        this.session.set(null);
        this.user.set(null);
      }
    } catch (err) {
      console.error('[AuthService] Session check failed', err);
      this.session.set(null);
      this.user.set(null);
    } finally {
      this.loading.set(false);
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
        // Better Auth signIn returns { user, token } or { user, session, token }
        const res = data as any;
        this.user.set(res.user);
        // If session is missing in response, it will be picked up by cookies anyway,
        // but we set something to mark it as authenticated locally.
        this.session.set(res.session || { token: res.token }); 
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
      this.router.navigate(['/login']);
    } finally {
      this.loading.set(false);
    }
  }
}
