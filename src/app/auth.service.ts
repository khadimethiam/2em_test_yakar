import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // URL de votre backend

  constructor(private http: HttpClient) {}

  // Méthode pour enregistrer un utilisateur
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  // Méthode pour se connecter avec l'email et le mot de passe
  login(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user);
  }

  // Méthode pour se connecter avec un code d'authentification
  loginWithCode(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login-code`, { code_authentification: code });
  }

  // Méthode pour mettre à jour les informations de l'utilisateur
  updateUser(userId: string, updatedData: any): Observable<any> {
    // Récupérer le token stocké dans le localStorage
    const token = localStorage.getItem('token');
    // Ajouter le token dans l'en-tête de la requête
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put(`${this.apiUrl}/api/users/${userId}`, updatedData, { headers });
  }

  // Méthode pour mettre à jour la photo de l'utilisateur
  updateUserPhoto(userId: string, photoData: FormData): Observable<any> {
    // Récupérer le token stocké dans le localStorage
    const token = localStorage.getItem('token');
    // Ajouter le token dans l'en-tête de la requête
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put(`${this.apiUrl}/api/users/${userId}/photo`, photoData, { headers });
  }
}
