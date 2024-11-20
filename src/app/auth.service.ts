import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  register(user: any, token: string): Observable<any> {
    const headers = { Authorization: `Bearer ${token}` };
  
    return this.http.post(`${this.apiUrl}/register`, user, { headers });
  }
  

  // Méthode de connexion
  login(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user);
  }

  // Méthode de connexion avec un code
  loginWithCode(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-code`, {
      code_authentification: code,
    });
  }

  // Méthode de déconnexion
  logout() {
    // Supprimer le token du localStorage
    localStorage.removeItem('token');

    // Informer le backend de la déconnexion
    this.logoutBackend();

    // Rediriger l'utilisateur vers la page de connexion
    window.location.href = '/login'; // Redirection vers la page de login
  }

  // Méthode pour informer le backend que l'utilisateur est déconnecté
  private logoutBackend() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe(
      (response) => {
        console.log('Déconnexion réussie côté serveur');
      },
      (error) => {
        console.error('Erreur lors de la déconnexion côté serveur', error);
      }
    );
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
}
