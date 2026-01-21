import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideRouter } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([])
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state as loading', () => {
    expect(service.isLoading()).toBe(true);
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
  });
});
