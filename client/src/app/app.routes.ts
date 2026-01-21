import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login').then(m => m.LoginComponent)
    },
    {
        path: '',
        loadComponent: () => import('./dashboard').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
