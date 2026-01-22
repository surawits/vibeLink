import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinkService, Link, LinkLog, SystemLog } from './link.service';
import { AuthService } from './auth.service';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';
import * as QRCode from 'qrcode';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    InputTextModule, 
    ButtonModule, 
    TableModule, 
    CardModule, 
    ToastModule,
    CheckboxModule,
    InputNumberModule,
    DialogModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    ToggleSwitchModule,
    IconFieldModule,
    InputIconModule,
    FloatLabelModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    MessageModule,
    CalendarModule,
    ChartModule
  ],
  providers: [],
  template: `
    <div class="min-h-screen surface-ground p-5 w-full max-w-7xl mx-auto">
      
      <p-toolbar styleClass="mb-4 gap-2 border-none shadow-1 surface-card border-round-xl px-4 py-3">
            <ng-template pTemplate="left">
                <div class="flex flex-column">
                    <h2 class="m-0 text-900 font-semibold">Your Vibes</h2>
                    <span class="text-500 mt-1">Manage and track your shortened links</span>
                </div>
            </ng-template>
            <ng-template pTemplate="right">
                <div class="flex gap-2">
                    <p-button label="System Logs" icon="pi pi-terminal" severity="secondary" [text]="true" (onClick)="viewSystemLogs()"></p-button>
                    <p-button label="New Vibe" icon="pi pi-plus" severity="primary" [raised]="true" (onClick)="openNew()"></p-button>
                </div>
            </ng-template>
        </p-toolbar>

        <div class="card shadow-1 border-round-xl surface-card p-0 overflow-hidden">
            <p-table [value]="links()" [responsiveLayout]="'scroll'" [rows]="10" [paginator]="true" [rowHover]="true"
                     styleClass="p-datatable-lg" [tableStyle]="{'min-width': '60rem'}">
                <ng-template pTemplate="header">
                <tr class="bg-gray-50 border-bottom-1 surface-border">
                    <th pSortableColumn="originalUrl" class="font-bold text-900">Original URL <p-sortIcon field="originalUrl"></p-sortIcon></th>
                    <th pSortableColumn="shortCode" class="font-bold text-900">Short Link <p-sortIcon field="shortCode"></p-sortIcon></th>
                    @if (authService.isAdmin()) {
                        <th class="font-bold text-900">Redirect</th>
                    }
                    <th pSortableColumn="clicks" class="font-bold text-900">Clicks <p-sortIcon field="clicks"></p-sortIcon></th>
                    <th pSortableColumn="isActive" class="font-bold text-900">Status <p-sortIcon field="isActive"></p-sortIcon></th>
                    <th class="font-bold text-900 text-center">Actions</th>
                </tr>
                </ng-template>
                <ng-template pTemplate="body" let-link>
                <tr>
                    <td style="max-width: 300px">
                        <div class="text-truncate text-700" [title]="link.originalUrl">{{link.originalUrl}}</div>
                    </td>
                    <td>
                    <a [href]="linkService.baseUrl + '/' + link.shortCode" target="_blank" class="text-blue-600 font-medium no-underline hover:text-blue-800 transition-colors">
                        {{link.shortCode}}
                    </a>
                    </td>
                    @if (authService.isAdmin()) {
                        <td>
                            @if (link.hasIntermediatePage) {
                                <p-tag severity="warn" value="Delayed: {{link.intermediatePageDelay}}s" icon="pi pi-clock"></p-tag>
                            } @else {
                                <p-tag severity="info" value="Direct" icon="pi pi-arrow-right"></p-tag>
                            }
                        </td>
                    }
                    <td>
                        <span class="font-semibold text-700">{{link.clicks}}</span>
                    </td>
                    <td>
                        <p-tag [value]="link.isActive ? 'Active' : 'Inactive'" [severity]="link.isActive ? 'success' : 'danger'"></p-tag>
                    </td>
                    <td class="text-center">
                        <div class="flex gap-2 justify-content-center">
                            <button pButton pRipple icon="pi pi-qrcode" class="p-button-rounded p-button-text p-button-info" (click)="showQrCode(link)" pTooltip="QR Code"></button>
                            <button pButton pRipple icon="pi pi-chart-bar" class="p-button-rounded p-button-text p-button-secondary" (click)="viewStats(link)" pTooltip="Stats"></button>
                            <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-primary" (click)="editLink(link)" pTooltip="Edit"></button>
                            <button pButton pRipple icon="pi pi-copy" class="p-button-rounded p-button-text p-button-help" (click)="copyToClipboard(link.shortCode)" pTooltip="Copy"></button>
                            <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" (click)="deleteLink(link)" pTooltip="Delete"></button>
                        </div>
                    </td>
                </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="6" class="text-center p-6">
                        <div class="flex flex-column align-items-center gap-3">
                            <i class="pi pi-inbox text-5xl text-400"></i>
                            <span class="text-500 font-medium text-lg">No vibes created yet. Start by creating your first one!</span>
                        </div>
                    </td>
                </tr>
                </ng-template>
            </p-table>
      </div>

      <!-- System Logs Dialog -->
      <p-dialog [(visible)]="sysLogDialog" [style]="{width: '1000px'}" header="System Debug Logs" [modal]="true" [maximizable]="true">
        <ng-template pTemplate="content">
            <p-table [value]="sysLogs()" [rows]="15" [paginator]="true" styleClass="p-datatable-sm p-datatable-striped">
                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 180px">Timestamp</th>
                        <th style="width: 100px">Level</th>
                        <th>Message</th>
                        <th>Context</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-log>
                    <tr>
                        <td class="text-sm">{{log.createdAt | date:'medium'}}</td>
                        <td>
                            <p-tag [severity]="getLogLevelSeverity(log.level)" [value]="log.level"></p-tag>
                        </td>
                        <td class="text-sm font-semibold">{{log.message}}</td>
                        <td class="text-xs text-600 font-mono">{{log.context || '-'}}</td>
                    </tr>
                </ng-template>
            </p-table>
        </ng-template>
        <ng-template pTemplate="footer">
             <p-button label="Refresh" icon="pi pi-refresh" [text]="true" (onClick)="loadSystemLogs()"></p-button>
             <p-button label="Close" icon="pi pi-times" [text]="true" (onClick)="sysLogDialog = false"></p-button>
        </ng-template>
      </p-dialog>

      <!-- Edit/Create Dialog - Registration Form Style -->
      <p-dialog [(visible)]="linkDialog" [style]="{width: '600px'}" header="Vibe Configuration" [modal]="true" styleClass="p-fluid">
            <ng-template pTemplate="content">
                <div class="flex flex-column gap-2 pt-4">
                    
                    <!-- Row 1: Long URL -->
                    <div class="field grid align-items-start">
                        <label for="url" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right pt-2">
                            <span class="text-red-500 mr-1">*</span>Long URL
                        </label>
                        <div class="col-12 md:col-9">
                            <input pInputText id="url" [(ngModel)]="link.originalUrl" placeholder="https://example.com/awesome-page" [ngClass]="{'ng-invalid ng-dirty': submitted && !link.originalUrl}" />
                            <small *ngIf="submitted && !link.originalUrl" class="p-error block mt-1">Destination URL is required.</small>
                        </div>
                    </div>

                    <!-- Row 2: Alias -->
                    <div class="field grid align-items-center">
                        <label for="alias" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right">Custom Alias</label>
                        <div class="col-12 md:col-9">
                            <p-inputGroup>
                                <p-inputGroupAddon class="surface-100">vibelnk.com/</p-inputGroupAddon>
                                <input type="text" pInputText id="alias" [(ngModel)]="link.shortCode" placeholder="my-custom-vibe" />
                                <button type="button" pButton icon="pi pi-refresh" (click)="generateAlias()" pTooltip="Generate Random" class="p-button-secondary"></button>
                            </p-inputGroup>
                            <small class="text-500 block mt-1">Leave empty for a random short code.</small>
                        </div>
                    </div>

                    <!-- Row 3: Status -->
                    <div class="field grid align-items-center">
                        <label for="isActive" class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right">Active Status</label>
                        <div class="col-12 md:col-9">
                            <div class="flex align-items-center gap-3">
                                <p-toggleswitch [(ngModel)]="link.isActive" inputId="isActive"></p-toggleswitch>
                                <span class="text-sm" [ngClass]="link.isActive ? 'text-green-600 font-medium' : 'text-red-500'">
                                    {{ link.isActive ? 'Link is Live' : 'Link is Disabled' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Row 4: Redirect Page -->
                    @if (authService.isAdmin()) {
                        <div class="field grid align-items-start">
                            <label class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right pt-2">Intermediate Page</label>
                            <div class="col-12 md:col-9">
                                <div class="surface-50 border-1 surface-border border-round p-3">
                                    <div class="flex align-items-center gap-2 mb-3">
                                        <p-checkbox [(ngModel)]="link.hasIntermediatePage" [binary]="true" inputId="intermediate"></p-checkbox>
                                        <label for="intermediate" class="cursor-pointer select-none">Show countdown page</label>
                                    </div>
                                    
                                    @if (link.hasIntermediatePage) {
                                        <div class="flex align-items-center gap-3 fadein animation-duration-200">
                                            <label for="delay" class="text-sm">Wait time:</label>
                                            <p-inputNumber id="delay" [(ngModel)]="link.intermediatePageDelay" [min]="0" [max]="60" [showButtons]="true" 
                                                buttonLayout="horizontal" inputStyleClass="w-3rem text-center p-0" styleClass="w-auto"
                                                decrementButtonClass="p-button-secondary p-button-sm" incrementButtonClass="p-button-secondary p-button-sm" 
                                                incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus">
                                            </p-inputNumber>
                                            <span class="text-sm">seconds</span>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }

                    <!-- Row 5: Limits (Expiration) -->
                    <div class="field grid align-items-start">
                        <label class="col-12 mb-2 md:col-3 md:mb-0 font-semibold text-right pt-2">Limits</label>
                        <div class="col-12 md:col-9">
                             <div class="surface-50 border-1 surface-border border-round p-3 flex flex-column gap-3">
                                <div class="flex flex-column gap-2">
                                    <label for="expiresAt" class="text-sm font-semibold">Expiration Date</label>
                                    <p-calendar id="expiresAt" [(ngModel)]="expirationDate" [showTime]="true" [showIcon]="true" appendTo="body" placeholder="Never"></p-calendar>
                                </div>
                                <div class="flex flex-column gap-2">
                                    <label for="maxClicks" class="text-sm font-semibold">Max Clicks</label>
                                    <p-inputNumber id="maxClicks" [(ngModel)]="link.maxClicks" [min]="0" showButtons="true" placeholder="0 = Unlimited"
                                        buttonLayout="horizontal" inputStyleClass="text-center" styleClass="w-full"
                                        decrementButtonClass="p-button-secondary" incrementButtonClass="p-button-secondary" 
                                        incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus">
                                    </p-inputNumber>
                                    <small class="text-500">Set to 0 for unlimited clicks.</small>
                                </div>
                             </div>
                        </div>
                    </div>

                </div>

                @if (error()) {
                    <div class="mt-4">
                        <p-message severity="error" [text]="error()!" styleClass="w-full"></p-message>
                    </div>
                }
            </ng-template>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2 pt-3 border-top-1 surface-border">
                    <p-button label="Cancel" icon="pi pi-times" [text]="true" (onClick)="hideDialog()"></p-button>
                    <p-button label="Save Vibe" icon="pi pi-check" severity="primary" (onClick)="saveLink()"></p-button>
                </div>
            </ng-template>
      </p-dialog>

      <!-- Stats Dialog -->
      <p-dialog [(visible)]="statsDialog" [style]="{width: '900px'}" header="Vibe Analytics" [modal]="true" [maximizable]="true" [draggable]="false">
        <ng-template pTemplate="header">
            <div class="flex align-items-center gap-2">
                <i class="pi pi-chart-line text-xl text-primary"></i>
                <span class="font-bold text-lg">Analytics: {{currentStatsLink?.shortCode}}</span>
            </div>
        </ng-template>
        <ng-template pTemplate="content">
            <div class="p-3">
                
                <!-- Charts Section -->
                <div class="grid mb-4">
                    <div class="col-12 md:col-8">
                        <div class="card h-full p-3 surface-card border-round shadow-1">
                            <span class="block font-bold mb-3">Traffic Trend</span>
                            <p-chart type="line" [data]="clicksChartData()" [options]="clicksChartOptions()" height="250px"></p-chart>
                        </div>
                    </div>
                    <div class="col-12 md:col-4">
                        <div class="card h-full p-3 surface-card border-round shadow-1">
                            <span class="block font-bold mb-3">Devices</span>
                            <p-chart type="doughnut" [data]="deviceChartData()" [options]="deviceChartOptions()" height="250px"></p-chart>
                        </div>
                    </div>
                </div>

                <p-table [value]="logs()" [rows]="10" [paginator]="true" styleClass="p-datatable-sm p-datatable-striped" [rowHover]="true">
                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="createdAt">Date <p-sortIcon field="createdAt"></p-sortIcon></th>
                            <th pSortableColumn="device">Device <p-sortIcon field="device"></p-sortIcon></th>
                            <th pSortableColumn="browser">Browser <p-sortIcon field="browser"></p-sortIcon></th>
                            <th pSortableColumn="os">OS <p-sortIcon field="os"></p-sortIcon></th>
                            <th>IP</th>
                            <th>Referrer</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-log>
                        <tr>
                            <td>{{log.createdAt | date:'medium'}}</td>
                            <td><i [class]="'pi ' + (log.device === 'Mobile' ? 'pi-mobile' : 'pi-desktop') + ' mr-2 text-500'"></i>{{log.device}}</td>
                            <td>{{log.browser}}</td>
                            <td>{{log.os}}</td>
                            <td class="font-mono text-sm text-600">{{log.ip}}</td>
                            <td class="text-truncate text-600" style="max-width: 200px" [title]="log.referrer">{{log.referrer || '-'}}</td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6" class="text-center p-5">
                                <span class="text-500">No data available yet.</span>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </ng-template>
        <ng-template pTemplate="footer">
             <div class="flex justify-content-between w-full px-3 pb-2">
                <div class="flex gap-2">
                    <p-button label="Reset Stats" icon="pi pi-trash" severity="danger" [outlined]="true" (onClick)="resetStats()"></p-button>
                    <p-button label="Export CSV" icon="pi pi-download" severity="help" [outlined]="true" (onClick)="exportStats()"></p-button>
                </div>
                <p-button label="Close" icon="pi pi-times" [text]="true" (onClick)="statsDialog = false"></p-button>
             </div>
        </ng-template>
      </p-dialog>

      <!-- QR Code Dialog -->
      <p-dialog [(visible)]="qrDialog" [style]="{width: '400px'}" header="Vibe QR Code" [modal]="true" [draggable]="false" [resizable]="false">
        <ng-template pTemplate="content">
            <div class="flex flex-column align-items-center justify-content-center pt-3">
                @if (qrCodeData()) {
                    <img [src]="qrCodeData()" alt="QR Code" class="border-1 surface-border border-round" style="width: 250px; height: 250px;">
                }
                <div class="mt-3 text-center">
                    <span class="font-bold text-lg block">{{ currentQrLink?.shortCode }}</span>
                    <a [href]="getQrUrl()" target="_blank" class="text-sm text-600 no-underline hover:text-primary transition-colors">{{ getQrUrl() }}</a>
                </div>
            </div>
        </ng-template>
        <ng-template pTemplate="footer">
            <div class="flex justify-content-center w-full pb-2">
                <button pButton label="Download PNG" icon="pi pi-download" (click)="downloadQrCode()"></button>
            </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .text-truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host ::ng-deep .p-dialog .p-dialog-content {
        padding-bottom: 0.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  public linkService = inject(LinkService);
  public authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  links = signal<Link[]>([]);
  logs = signal<LinkLog[]>([]);
  sysLogs = signal<SystemLog[]>([]);
  error = signal<string | undefined>(undefined);
  
  linkDialog: boolean = false;
  statsDialog: boolean = false;
  sysLogDialog: boolean = false;
  qrDialog: boolean = false;
  
  qrCodeData = signal<string>('');
  currentQrLink: Link | null = null;
  expirationDate: Date | undefined = undefined;
  
  // Charts
  clicksChartData = signal<any>(null);
  clicksChartOptions = signal<any>(null);
  deviceChartData = signal<any>(null);
  deviceChartOptions = signal<any>(null);

  link: Link = this.createEmptyLink();
  currentStatsLink: Link | null = null;
  submitted: boolean = false;
  isEditMode: boolean = false;

  ngOnInit() {
    console.log('[Dashboard] Initializing component');
    this.initChartOptions();
    this.loadLinks();
  }
  
  initChartOptions() {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
      const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

      this.clicksChartOptions.set({
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          plugins: {
              legend: {
                  labels: { color: textColor }
              }
          },
          scales: {
              x: {
                  ticks: { color: textColorSecondary },
                  grid: { color: surfaceBorder, drawBorder: false }
              },
              y: {
                  ticks: { color: textColorSecondary },
                  grid: { color: surfaceBorder, drawBorder: false }
              }
          }
      });

      this.deviceChartOptions.set({
          plugins: {
              legend: {
                  labels: { usePointStyle: true, color: textColor }
              }
          }
      });
  }

  // ... (previous methods)

  async showQrCode(link: Link) {
      this.currentQrLink = link;
      const url = `${this.linkService.baseUrl}/${link.shortCode}`;
      try {
          const dataUrl = await QRCode.toDataURL(url, {
              width: 300,
              margin: 2,
              color: {
                  dark: '#000000',
                  light: '#ffffff'
              }
          });
          this.qrCodeData.set(dataUrl);
          this.qrDialog = true;
      } catch (err) {
          console.error('[Dashboard] Failed to generate QR code', err);
          this.messageService.add({severity:'error', summary: 'Error', detail: 'Could not generate QR Code'});
      }
  }

  downloadQrCode() {
      if (!this.qrCodeData() || !this.currentQrLink) return;
      
      const link = document.createElement('a');
      link.href = this.qrCodeData();
      link.download = `vibe_qr_${this.currentQrLink.shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  getQrUrl() {
      if (!this.currentQrLink) return '';
      return `${this.linkService.baseUrl}/${this.currentQrLink.shortCode}`;
  }

  createEmptyLink(): Link {
      return {
          originalUrl: '',
          shortCode: '',
          clicks: 0,
          createdAt: '',
          hasIntermediatePage: false,
          intermediatePageDelay: 5,
          isActive: true,
          maxClicks: 0
      };
  }

  loadLinks() {
    console.log('[Dashboard] Loading links from service');
    this.linkService.getLinks().subscribe(data => {
      console.log(`[Dashboard] Successfully loaded ${data.length} links`);
      this.links.set(data);
    });
  }

  viewSystemLogs() {
      this.sysLogDialog = true;
      this.loadSystemLogs();
  }

  loadSystemLogs() {
      this.linkService.getSystemLogs().subscribe(data => {
          this.sysLogs.set(data);
      });
  }

  getLogLevelSeverity(level: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined {
      switch (level) {
          case 'ERROR': return 'danger';
          case 'WARN': return 'warn';
          case 'DEBUG': return 'secondary';
          case 'INFO': return 'info';
          default: return 'info';
      }
  }

  openNew() {
      console.log('[Dashboard] Opening dialog for new link');
      this.link = this.createEmptyLink();
      this.expirationDate = undefined;
      this.submitted = false;
      this.error.set(undefined);
      this.linkDialog = true;
      this.isEditMode = false;
  }

  generateAlias() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      const length = Math.floor(Math.random() * (8 - 5 + 1)) + 5; 
      for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      console.log(`[Dashboard] Generated random alias: ${result}`);
      this.link.shortCode = result;
  }

  editLink(link: Link) {
      console.log(`[Dashboard] Editing link ID: ${link.id}`);
      this.link = { ...link };
      this.expirationDate = link.expiresAt ? new Date(link.expiresAt) : undefined;
      this.error.set(undefined);
      this.linkDialog = true;
      this.isEditMode = true;
  }

  viewStats(link: Link) {
      console.log(`[Dashboard] Viewing stats for link ID: ${link.id}`);
      this.currentStatsLink = link;
      this.statsDialog = true;
      this.loadStats(link.id!);
  }

  loadStats(id: number) {
      // Load Logs
      this.linkService.getStats(id).subscribe(data => {
          this.logs.set(data);
      });
      
      // Load Charts
      this.linkService.getAggregatedStats(id).subscribe(data => {
          this.clicksChartData.set({
              labels: data.clicksOverTime.labels,
              datasets: [
                  {
                      label: 'Clicks (Last 7 Days)',
                      data: data.clicksOverTime.data,
                      fill: true,
                      borderColor: '#3b82f6',
                      tension: 0.4,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)'
                  }
              ]
          });
          
          const deviceLabels = Object.keys(data.deviceStats);
          const deviceValues = Object.values(data.deviceStats);
          
          this.deviceChartData.set({
              labels: deviceLabels,
              datasets: [
                  {
                      data: deviceValues,
                      backgroundColor: [
                          "#42A5F5", "#66BB6A", "#FFA726", "#26C6DA", "#7E57C2"
                      ],
                      hoverBackgroundColor: [
                          "#64B5F6", "#81C784", "#FFB74D", "#4DD0E1", "#9575CD"
                      ]
                  }
              ]
          });
      });
  }

  resetStats() {
      if (!this.currentStatsLink) return;
      
      this.confirmationService.confirm({
          message: 'Are you sure you want to reset clicks and clear all logs? This cannot be undone.',
          header: 'Confirm Reset',
          icon: 'pi pi-exclamation-triangle',
          acceptButtonStyleClass: 'p-button-danger',
          accept: () => {
              console.log(`[Dashboard] Resetting stats for link ID: ${this.currentStatsLink!.id}`);
              this.linkService.resetStats(this.currentStatsLink!.id!).subscribe({
                  next: () => {
                      this.messageService.add({severity:'success', summary: 'Reset Successful', detail: 'Stats have been cleared.'});
                      this.loadStats(this.currentStatsLink!.id!);
                      this.loadLinks(); 
                  },
                  error: (err: any) => {
                      console.error(`[Dashboard] Reset stats failed:`, err);
                      this.messageService.add({severity:'error', summary: 'Error', detail: 'Failed to reset stats'});
                  }
              });
          }
      });
  }

  exportStats() {
      if (!this.currentStatsLink) return;
      console.log(`[Dashboard] Exporting stats for link ID: ${this.currentStatsLink.id}`);

      this.linkService.exportStats(this.currentStatsLink.id!).subscribe({
          next: (blob) => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vibeLink_stats_${this.currentStatsLink!.shortCode}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              console.log(`[Dashboard] CSV export triggered`);
          },
          error: (err: any) => {
              console.error(`[Dashboard] Export failed:`, err);
              this.messageService.add({severity:'error', summary: 'Error', detail: 'Failed to export stats'});
          }
      });
  }

  deleteLink(link: Link) {
      this.confirmationService.confirm({
          message: 'Are you sure you want to delete ' + link.shortCode + '?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
              console.log(`[Dashboard] Deleting link ID: ${link.id}`);
              this.linkService.delete(link.id!).subscribe({
                  next: () => {
                      this.messageService.add({severity:'success', summary: 'Successful', detail: 'Link Deleted', life: 3000});
                      this.loadLinks();
                  },
                  error: (err: any) => {
                      console.error(`[Dashboard] Delete failed:`, err);
                      this.messageService.add({severity:'error', summary: 'Error', detail: 'Failed to delete link'});
                  }
              });
          }
      });
  }

  hideDialog() {
      this.linkDialog = false;
      this.submitted = false;
      this.error.set(undefined);
  }

  saveLink() {
      this.submitted = true;
      this.error.set(undefined);
      
      // Update link object with separate Date model
      this.link.expiresAt = this.expirationDate ? this.expirationDate.toISOString() : null;

      if (this.link.originalUrl.trim()) {
          console.log(`[Dashboard] Saving link (EditMode=${this.isEditMode}):`, this.link);
          if (this.isEditMode && this.link.id) {
              this.linkService.update(this.link.id, this.link).subscribe({
                  next: () => {
                      console.log('[Dashboard] Update successful');
                      this.messageService.add({severity:'success', summary: 'Successful', detail: 'Link Updated', life: 3000});
                      this.hideDialog();
                      this.loadLinks();
                  },
                  error: (err: any) => {
                      console.error(`[Dashboard] Update failed:`, err);
                      const msg = err.error?.error || 'Update failed';
                      this.error.set(msg);
                      this.messageService.add({severity:'error', summary: 'Error', detail: msg});
                  }
              });
          } else {
              this.linkService.shorten(
                  this.link.originalUrl, 
                  this.link.shortCode, 
                  this.link.hasIntermediatePage, 
                  this.link.intermediatePageDelay,
                  this.link.isActive
              ).subscribe({
                  next: () => {
                      console.log('[Dashboard] Creation successful');
                      this.messageService.add({severity:'success', summary: 'Successful', detail: 'Link Created', life: 3000});
                      this.hideDialog();
                      this.loadLinks();
                  },
                  error: (err: any) => {
                      console.error(`[Dashboard] Creation failed:`, err);
                      const msg = err.error?.error || 'Creation failed';
                      this.error.set(msg);
                      this.messageService.add({severity:'error', summary: 'Error', detail: msg});
                  }
              });
          }
      }
  }

  copyToClipboard(code: string) {
    const fullUrl = `${this.linkService.baseUrl}/${code}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      console.log(`[Dashboard] Copied to clipboard: ${fullUrl}`);
      this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Link copied to clipboard!' });
    });
  }
}
