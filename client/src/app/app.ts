import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './auth.service';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    ToastModule, 
    ConfirmDialogModule,
    ButtonModule,
    TooltipModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="min-h-screen flex flex-column surface-ground">
      <p-toast></p-toast>
      <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>

      @if (authService.isAuthenticated()) {
        <div class="bg-blue-700 h-4rem flex align-items-center px-4 shadow-2 text-white justify-content-between relative z-2">
          <div class="flex align-items-center gap-4">
             <div class="flex align-items-center gap-2 cursor-pointer" routerLink="/">
                <i class="pi pi-bolt text-2xl text-white"></i>
                <span class="text-xl font-bold">vibeLink</span>
             </div>
             
             @if (authService.isAdmin()) {
                <a routerLink="/users/manage" routerLinkActive="text-white font-bold bg-blue-800 border-round" 
                   class="text-blue-100 hover:text-white hover:bg-blue-800 no-underline transition-colors p-2 px-3 border-round cursor-pointer flex align-items-center gap-2">
                    <i class="pi pi-users"></i>
                    <span>Users</span>
                </a>
                <a routerLink="/admin/links" routerLinkActive="text-white font-bold bg-blue-800 border-round" 
                   class="text-blue-100 hover:text-white hover:bg-blue-800 no-underline transition-colors p-2 px-3 border-round cursor-pointer flex align-items-center gap-2">
                    <i class="pi pi-list"></i>
                    <span>All Links</span>
                </a>
             }
          </div>
          <div class="flex align-items-center gap-3">
            <div class="flex flex-column align-items-end">
                <span class="text-sm font-bold flex align-items-center gap-2">
                    {{ authService.currentUser()?.name }}
                    @if (authService.isAdmin()) { <p-tag value="Admin" severity="info" styleClass="text-xs py-0 shadow-1"></p-tag> }
                </span>
                <span class="text-xs text-blue-100">{{ authService.currentUser()?.email }}</span>
             </div>
            <button pButton icon="pi pi-sign-out" class="p-button-rounded p-button-text text-white hover:surface-white hover:text-blue-700 transition-colors" 
                    pTooltip="Logout" tooltipPosition="bottom" (click)="authService.logout()"></button>
          </div>
        </div>
      }
      
      <div class="flex-grow-1">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);
}