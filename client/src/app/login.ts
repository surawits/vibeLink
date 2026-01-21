import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    ProgressBarModule
  ],
  template: `
    <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
      <p-card header="vibeLink Admin" [style]="{ width: '400px' }" styleClass="shadow-3 border-round-xl">
        <p class="mb-4 text-600">Please sign in to manage your vibes.</p>
        
        @if (authService.isLoading()) {
          <p-progressBar mode="indeterminate" [style]="{ height: '4px' }" class="mb-4" />
        }

        <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="flex flex-column gap-4">
          <div class="flex flex-column gap-2">
            <label for="email" class="font-medium">Email</label>
            <input 
              pInputText 
              id="email" 
              name="email" 
              type="email" 
              [(ngModel)]="email" 
              required 
              email
              #emailModel="ngModel"
              placeholder="admin@vibelink.local"
              class="w-full"
            />
            @if (emailModel.invalid && (emailModel.dirty || emailModel.touched)) {
              <p-message severity="error" variant="simple" text="Valid email is required" />
            }
          </div>

          <div class="flex flex-column gap-2">
            <label for="password" class="font-medium">Password</label>
            <p-password 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              [feedback]="false" 
              [toggleMask]="true"
              required
              #passwordModel="ngModel"
              placeholder="••••••••"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            @if (passwordModel.invalid && (passwordModel.dirty || passwordModel.touched)) {
              <p-message severity="error" variant="simple" text="Password is required" />
            }
          </div>

          @if (error()) {
            <p-message severity="error" [text]="error()" class="w-full" />
          }

          <div class="mt-2">
            <p-button 
              label="Login" 
              type="submit" 
              icon="pi pi-sign-in" 
              [style]="{width: '100%'}"
              [disabled]="loginForm.invalid || authService.isLoading()"
            />
          </div>
        </form>
      </p-card>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  error = signal<string | undefined>(undefined);

  async onLogin() {
    this.error.set(undefined);
    try {
      const result = await this.authService.login(this.email, this.password);
      if (result) {
        this.router.navigate(['/']);
      }
    } catch (err: any) {
      console.error('[Login] Error', err);
      this.error.set(err.message || 'Invalid email or password');
    }
  }
}
