import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  forceChangePassword: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-user-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    CardModule,
    MessageModule
  ],
  providers: [],
  template: `
    <div class="p-4">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="m-0 text-900">User Management</h2>
        <p-button label="New User" icon="pi pi-plus" (onClick)="openNew()" />
      </div>

      <p-card styleClass="shadow-2 border-round-xl">
          <p-table [value]="users()" [loading]="loading()" [tableStyle]="{ 'min-width': '50rem' }"
                   styleClass="p-datatable-sm" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Password</th>
                <th>Created</th>
                <th style="width: 120px"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td class="font-medium">{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                    <p-tag [value]="user.role" [severity]="getRoleSeverity(user.role)" />
                </td>
                <td>
                    <p-tag [value]="user.isActive ? 'Active' : 'Inactive'" [severity]="user.isActive ? 'success' : 'danger'" />
                </td>
                <td>
                    @if (user.forceChangePassword) {
                        <p-tag value="Reset Req." severity="warn" />
                    } @else {
                        <span class="text-500 text-sm">OK</span>
                    }
                </td>
                <td>{{ user.createdAt | date:'short' }}</td>
                <td>
                  <div class="flex gap-2">
                    <p-button icon="pi pi-key" [text]="true" severity="warn" (onClick)="resetPassword(user)" pTooltip="Reset Password" />
                    <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="editUser(user)" pTooltip="Edit" />
                    <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteUser(user)" 
                              [disabled]="user.email === 'admin@vibelink.local'" pTooltip="Delete" />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
      </p-card>

      <p-dialog [(visible)]="userDialog" [style]="{ width: '600px' }" header="User Configuration" [modal]="true" styleClass="p-fluid">
        <ng-template pTemplate="content">
          <div class="flex flex-column gap-2 pt-4">
            
            <!-- Row 1: Name -->
            <div class="field grid align-items-center">
                <label for="name" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right">
                    <span class="text-red-500 mr-1">*</span>Name
                </label>
                <div class="col-12 md:col-9">
                    <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus />
                    @if (submitted && !user.name) {
                        <small class="p-error block mt-1">Name is required.</small>
                    }
                </div>
            </div>
            
            <!-- Row 2: Email -->
            <div class="field grid align-items-center">
                <label for="email" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right">
                    <span class="text-red-500 mr-1">*</span>Email
                </label>
                <div class="col-12 md:col-9">
                    <input type="email" pInputText id="email" [(ngModel)]="user.email" required [disabled]="!!user.id" />
                    @if (submitted && !user.email) {
                        <small class="p-error block mt-1">Email is required.</small>
                    }
                </div>
            </div>

            <!-- Row 3: Role -->
            <div class="field grid align-items-center">
                <label for="role" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right">Role</label>
                <div class="col-12 md:col-9">
                    <p-select [options]="roles" [(ngModel)]="user.role" optionLabel="label" optionValue="value" appendTo="body" />
                </div>
            </div>

            <!-- Row 4: Status -->
            <div class="field grid align-items-center">
                <label class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right">Settings</label>
                <div class="col-12 md:col-9">
                    <div class="flex flex-column gap-3">
                        <div class="flex align-items-center gap-2">
                            <p-checkbox [(ngModel)]="user.isActive" [binary]="true" inputId="isActive"></p-checkbox>
                            <label for="isActive" class="cursor-pointer select-none">User is Active</label>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <p-checkbox [(ngModel)]="user.forceChangePassword" [binary]="true" inputId="forcePass"></p-checkbox>
                            <label for="forcePass" class="cursor-pointer select-none">Force Password Change</label>
                        </div>
                    </div>
                </div>
            </div>
            
            @if (!user.id) {
                <!-- Row 5: Initial Password -->
                <div class="field grid align-items-start">
                    <label for="password" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right pt-2">Initial Password</label>
                    <div class="col-12 md:col-9">
                        <input type="text" pInputText id="password" [(ngModel)]="user.password" placeholder="Auto-generated if empty" />
                        <small class="block text-500 mt-1">Must match policy: Upper, Lower, Number, Special.</small>
                    </div>
                </div>
            }
          </div>

          @if (error()) {
            <div class="mt-4">
                <p-message severity="error" [text]="error()!" styleClass="w-full"></p-message>
            </div>
          }
        </ng-template>

        <ng-template pTemplate="footer">
            <div class="flex justify-content-end gap-2 pt-3 border-top-1 surface-border">
                <button pButton pRipple label="Cancel" icon="pi pi-times" class="p-button-text" (click)="hideDialog()"></button>
                <button pButton pRipple label="Save User" icon="pi pi-check" (click)="saveUser()"></button>
            </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class UserMaintenanceComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | undefined>(undefined);
  userDialog = false;
  submitted = false;
  
  user: any = {};
  
  roles = [
      { label: 'User', value: 'user' },
      { label: 'Admin', value: 'admin' }
  ];

  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);

  ngOnInit() {
      this.loadUsers();
  }

  async loadUsers() {
      this.loading.set(true);
      try {
          const res = await fetch(`${environment.baseUrl}/api/users`, {
              credentials: 'include'
          });
          if (res.ok) {
              this.users.set(await res.json());
          } else {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
          }
      } catch (e) {
          console.error(e);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Network error' });
      } finally {
          this.loading.set(false);
      }
  }

  openNew() {
      this.user = { isActive: true, role: 'user', forceChangePassword: true };
      this.submitted = false;
      this.error.set(undefined);
      this.userDialog = true;
  }

  editUser(user: User) {
      this.user = { ...user };
      this.error.set(undefined);
      this.userDialog = true;
  }

  hideDialog() {
      this.userDialog = false;
      this.submitted = false;
      this.error.set(undefined);
  }

  async saveUser() {
      this.submitted = true;
      this.error.set(undefined);
      if (!this.user.name || !this.user.email) return;

      try {
          const isNew = !this.user.id;
          const url = isNew ? `${environment.baseUrl}/api/users` : `${environment.baseUrl}/api/users/${this.user.id}`;
          const method = isNew ? 'POST' : 'PUT';
          
          const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(this.user)
          });

          const data = await res.json();

          if (res.ok) {
              this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'User Saved' });
              this.loadUsers();
              this.hideDialog();
          } else {
              const msg = data.error || 'Failed to save user';
              this.error.set(msg);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
          }
      } catch (e) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Network error' });
      }
  }

  deleteUser(user: User) {
      this.confirmationService.confirm({
          message: 'Are you sure you want to delete ' + user.name + '?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
          accept: async () => {
              try {
                  const res = await fetch(`${environment.baseUrl}/api/users/${user.id}`, {
                      method: 'DELETE',
                      credentials: 'include'
                  });
                  if (res.ok) {
                      this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'User Deleted' });
                      this.loadUsers();
                  } else {
                      const data = await res.json();
                      this.messageService.add({ severity: 'error', summary: 'Error', detail: data.error || 'Failed to delete user' });
                  }
              } catch (e) {
                  this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Network error' });
              }
          }
      });
  }

  resetPassword(user: User) {
      this.confirmationService.confirm({
          message: `Reset password for ${user.name} to 'InitPass123!'?`,
          header: 'Confirm Reset',
          icon: 'pi pi-exclamation-triangle',
          accept: async () => {
              try {
                  const res = await fetch(`${environment.baseUrl}/api/users/${user.id}/reset-password`, {
                      method: 'POST',
                      credentials: 'include'
                  });
                  if (res.ok) {
                      this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Password Reset' });
                      this.loadUsers();
                  } else {
                      const data = await res.json();
                      this.messageService.add({ severity: 'error', summary: 'Error', detail: data.error || 'Failed to reset password' });
                  }
              } catch (e) {
                  this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Network error' });
              }
          }
      });
  }
  
  getRoleSeverity(role: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
      return role === 'admin' ? 'contrast' : 'secondary';
  }
}
