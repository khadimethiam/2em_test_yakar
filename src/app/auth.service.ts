import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user);
  }

  loginWithCode(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-code`, {
      code_authentification: code,
    });
  }

  checkUserExists(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${this.apiUrl}/check-user-exists?email=${email}`
    );
  }
  // Méthode pour se déconnecter
  logout(): Observable<any> {
    // Supprimer le token du localStorage
    localStorage.removeItem('token');
    // Vous pouvez également envoyer une requête au backend pour invalider le token si nécessaire
    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }
}
