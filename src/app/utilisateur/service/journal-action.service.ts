import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JournalActionService {
  private apiUrl = 'http://localhost:9090/utilisateurs';

  constructor(private http: HttpClient) { }

  getUserActions(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}/journal`);
  }

  getActionsSinceLastLogin(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}/journal-last-login`);
  }
}
