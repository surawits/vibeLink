import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
    <router-outlet></router-outlet>
  `
})
export class App {}
