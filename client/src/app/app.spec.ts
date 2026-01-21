import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AuthService } from './auth.service';
import { provideRouter } from '@angular/router';
import { LinkService } from './link.service';
import { of } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { 
          provide: AuthService, 
          useValue: { 
            isLoading: () => false, 
            isAuthenticated: () => true,
            currentUser: () => ({ name: 'Admin' })
          } 
        },
        {
          provide: LinkService,
          useValue: {
            getLinks: () => of([]),
            baseUrl: 'http://localhost:3000'
          }
        },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render brand name', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.text-xl')?.textContent).toContain('vibeLink');
  });
});
