import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface SystemLog {
  id: number;
  level: string;
  message: string;
  context?: string;
  createdAt: string;
}

export interface LinkLog {
  id: number;
  linkId: number;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  createdAt: string;
}

export interface Link {
  id?: number;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
  hasIntermediatePage?: boolean;
  intermediatePageDelay?: number;
  isActive?: boolean;
  expiresAt?: string | null;
  maxClicks?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  public baseUrl = environment.baseUrl;

  getLinks(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.apiUrl}/links`);
  }

  getSystemLogs(): Observable<SystemLog[]> {
    return this.http.get<SystemLog[]>(`${this.apiUrl}/system-logs`);
  }

  shorten(
    url: string, 
    alias?: string, 
    hasIntermediatePage: boolean = false, 
    intermediatePageDelay: number = 0, 
    isActive: boolean = true,
    expiresAt?: string | null,
    maxClicks?: number
  ): Observable<Link> {
    return this.http.post<Link>(`${this.apiUrl}/links`, { 
      url, 
      alias,
      hasIntermediatePage,
      intermediatePageDelay,
      isActive,
      expiresAt,
      maxClicks
    });
  }

  update(id: number, link: Partial<Link>): Observable<Link> {
    return this.http.put<Link>(`${this.apiUrl}/links/${id}`, {
      url: link.originalUrl,
      alias: link.shortCode,
      hasIntermediatePage: link.hasIntermediatePage,
      intermediatePageDelay: link.intermediatePageDelay,
      isActive: link.isActive,
      expiresAt: link.expiresAt,
      maxClicks: link.maxClicks
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/links/${id}`);
  }

  getStats(id: number): Observable<LinkLog[]> {
    return this.http.get<LinkLog[]>(`${this.apiUrl}/links/${id}/stats`);
  }

  resetStats(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/links/${id}/reset`);
  }

  exportStats(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/links/${id}/export`, { responseType: 'blob' });
  }

  getAggregatedStats(id: number): Observable<{ clicksOverTime: { labels: string[], data: number[] }, deviceStats: Record<string, number> }> {
    return this.http.get<any>(`${this.apiUrl}/links/${id}/stats/aggregated`);
  }
}