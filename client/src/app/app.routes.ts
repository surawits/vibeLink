import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';
import { DashboardComponent } from './dashboard';
import { LoginComponent } from './login';
import { ChangePasswordComponent } from './change-password';
import { UserMaintenanceComponent } from './user-maintenance';
import { AdminLinksComponent } from './admin-links';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard]
  },
  {
    path: 'users/manage',
    component: UserMaintenanceComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/links',
    component: AdminLinksComponent,
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
