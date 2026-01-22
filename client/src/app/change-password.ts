import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

// PrimeNG
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    PasswordModule,
    ButtonModule,
    MessageModule
  ],
  template: `
    <div class="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
      <p-card header="Change Password" [style]="{ width: '400px' }" styleClass="shadow-3 border-round-xl">
        <p class="mb-4 text-600">
            @if (authService.mustChangePassword()) {
                Security Policy requires you to change your password.
            } @else {
                Update your password.
            }
        </p>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="flex flex-column gap-4">
          <div class="flex flex-column gap-2">
            <label for="currentPassword" class="font-medium">Current Password</label>
            <p-password 
              id="currentPassword" 
              name="currentPassword" 
              [(ngModel)]="currentPassword" 
              [feedback]="false" 
              [toggleMask]="true"
              required
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>

          <div class="flex flex-column gap-2">
            <label for="newPassword" class="font-medium">New Password</label>
            <p-password 
              id="newPassword" 
              name="newPassword" 
              [(ngModel)]="newPassword" 
              [feedback]="true" 
              [toggleMask]="true"
              required
              styleClass="w-full"
              inputStyleClass="w-full"
            >
                <ng-template pTemplate="header">
                    <h6>Pick a password</h6>
                </ng-template>
                <ng-template pTemplate="footer">
                    <ul class="pl-2 ml-2 mt-0 text-sm line-height-3">
                        <li>At least 8 characters</li>
                        <li>At least one lowercase</li>
                        <li>At least one uppercase</li>
                        <li>At least one numeric</li>
                        <li>At least one special character</li>
                    </ul>
                </ng-template>
            </p-password>
          </div>

          <div class="flex flex-column gap-2">
            <label for="confirmPassword" class="font-medium">Confirm New Password</label>
            <p-password 
              id="confirmPassword" 
              name="confirmPassword" 
              [(ngModel)]="confirmPassword" 
              [feedback]="false" 
              [toggleMask]="true"
              required
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            @if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                <small class="text-red-500">Passwords do not match</small>
            }
          </div>

          @if (error()) {
            <p-message severity="error" [text]="error()" class="w-full" />
          }
          @if (success()) {
            <p-message severity="success" text="Password changed successfully!" class="w-full" />
          }

          <div class="mt-2">
            <p-button 
              label="Change Password" 
              type="submit" 
              icon="pi pi-check" 
              [style]="{width: '100%'}"
              [disabled]="form.invalid || (newPassword !== confirmPassword) || loading()"
            />
          </div>
          
          <div class="text-center mt-2">
             <a class="text-sm cursor-pointer text-600 hover:text-900" (click)="cancel()">Cancel / Logout</a>
          </div>
        </form>
      </p-card>
    </div>
  `
})
export class ChangePasswordComponent {
  authService = inject(AuthService);
  router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  error = signal<string | undefined>(undefined);
  success = signal<boolean>(false);
  loading = signal<boolean>(false);

  async onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
        this.error.set("Passwords do not match");
        return;
    }
    
    this.loading.set(true);
    this.error.set(undefined);
    
    try {
        const res = await fetch(`${environment.baseUrl}/api/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important for cookie
            body: JSON.stringify({
                currentPassword: this.currentPassword,
                newPassword: this.newPassword
            })
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Failed to change password');
        }
        
        this.success.set(true);
        setTimeout(() => {
            // Re-fetch profile to update status
            this.authService.fetchFullProfile().then(() => {
                this.router.navigate(['/']);
            });
        }, 1500);

    } catch (e: any) {
        this.error.set(e.message);
    } finally {
        this.loading.set(false);
    }
  }

  cancel() {
      this.authService.logout();
  }
}
