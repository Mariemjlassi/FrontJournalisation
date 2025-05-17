import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Competence } from '../model/competence';

@Injectable({
  providedIn: 'root'
})
export class CompetenceService {
  private apiUrl = 'http://localhost:9090/api/competences';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Competence[]> {
    return this.http.get<Competence[]>(this.apiUrl);
  }

  create(competence: Competence): Observable<Competence> {
    return this.http.post<Competence>(this.apiUrl, competence);
  }

  update(id: number, competence: Competence): Observable<Competence> {
    return this.http.put<Competence>(`${this.apiUrl}/${id}`, competence);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  // Dans votre CompetenceService (ou un nouveau service si préférez)
getEmployesWithCompetence(competenceId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${competenceId}/employes`);
}
}
