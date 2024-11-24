import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';


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

// Méthode pour vérifier si l'utilisateur est authentifié
isAuthenticated(): boolean {
  // Vérifier si un token est stocké dans le localStorage
  return !!localStorage.getItem('token');
}

// Méthode pour récupérer le token
getToken(): string | null {
  return localStorage.getItem('token');
}

// Méthode pour définir le token dans le localStorage
setToken(token: string): void {
  localStorage.setItem('token', token);
}

// Méthode pour récupérer les informations de l'utilisateur connecté
getUserProfile(): Observable<any> {
const token = this.getToken();

// Configuration des en-têtes avec HttpHeaders
let headers = new HttpHeaders();
if (token) {
  headers = headers.set('Authorization', `Bearer ${token}`);
}

return this.http.get(`${this.apiUrl}/profile`, { headers });
}


  // Méthode pour vérifier le mot de passe
  verifyPassword(oldPassword: string): Observable<any> {
    const url = `${this.apiUrl}/users/verify-password`;  // L'endpoint de vérification du mot de passe
    return this.http.post<any>(url, { oldPassword });
  }


}
