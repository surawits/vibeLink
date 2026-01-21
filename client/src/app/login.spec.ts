import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login';
import { AuthService } from './auth.service';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { 
          provide: AuthService, 
          useValue: { 
            isLoading: () => false,
            login: () => Promise.resolve({ user: {}, session: {} })
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty email and password initially', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });
});
