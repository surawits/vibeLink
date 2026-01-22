import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { LinkService, Link } from './link.service';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

interface AdminLink extends Link {
    user?: {
        name: string;
        email: string;
    }
}

@Component({
  selector: 'app-admin-links',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    CardModule
  ],
  template: `
    <div class="p-4">
      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="m-0 text-900">All System Links</h2>
      </div>

      <p-card styleClass="shadow-2 border-round-xl">
          <p-table [value]="links()" [loading]="loading()" [tableStyle]="{ 'min-width': '60rem' }"
                   styleClass="p-datatable-sm" [paginator]="true" [rows]="10" [rowHover]="true">
            <ng-template pTemplate="header">
              <tr>
                <th>Created By</th>
                <th pSortableColumn="originalUrl">Original URL <p-sortIcon field="originalUrl"></p-sortIcon></th>
                <th pSortableColumn="shortCode">Short Code <p-sortIcon field="shortCode"></p-sortIcon></th>
                <th pSortableColumn="clicks">Clicks <p-sortIcon field="clicks"></p-sortIcon></th>
                <th pSortableColumn="createdAt">Created <p-sortIcon field="createdAt"></p-sortIcon></th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-link>
              <tr>
                <td>
                    <div class="flex flex-column">
                        <span class="font-bold text-sm">{{ link.user?.name || 'Unknown' }}</span>
                        <span class="text-xs text-500">{{ link.user?.email || '-' }}</span>
                    </div>
                </td>
                <td style="max-width: 250px">
                    <div class="white-space-nowrap overflow-hidden text-overflow-ellipsis" [title]="link.originalUrl">
                        {{ link.originalUrl }}
                    </div>
                </td>
                <td>
                    <a [href]="baseUrl + '/' + link.shortCode" target="_blank" class="text-blue-600 font-medium no-underline hover:text-blue-800">
                        {{ link.shortCode }}
                    </a>
                </td>
                <td><span class="font-bold">{{ link.clicks }}</span></td>
                <td>{{ link.createdAt | date:'short' }}</td>
                <td>
                    <p-tag [value]="link.isActive ? 'Active' : 'Inactive'" [severity]="link.isActive ? 'success' : 'danger'" />
                </td>
                <td>
                   <div class="flex gap-2">
                        <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteLink(link)" pTooltip="Delete" />
                   </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
      </p-card>
    </div>
  `
})
export class AdminLinksComponent implements OnInit {
    links = signal<AdminLink[]>([]);
    loading = signal<boolean>(true);
    baseUrl = environment.baseUrl;
    
    // We can reuse LinkService if we add the admin method, or just fetch directly here.
    // Let's fetch directly for simplicity or add to service.
    
    ngOnInit() {
        this.loadLinks();
    }

    async loadLinks() {
        this.loading.set(true);
        try {
            const res = await fetch(`${environment.baseUrl}/api/links/admin/all`, {
                credentials: 'include'
            });
            if (res.ok) {
                this.links.set(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.loading.set(false);
        }
    }

    async deleteLink(link: AdminLink) {
        if (!confirm('Delete this link?')) return;
        
        try {
            const res = await fetch(`${environment.baseUrl}/api/links/${link.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                this.loadLinks();
            }
        } catch (e) {
            console.error(e);
        }
    }
}
