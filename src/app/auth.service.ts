import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {

     // Récupérer le token du localStorage lors de l'initialisation du service
     const token = localStorage.getItem('token');
     if (token) {
       this.tokenSubject.next(token);
     }
   }
  

  

  register(user: any, token: string): Observable<any> {
    const headers = { Authorization: `Bearer ${token}` };
  
    return this.http.post(`${this.apiUrl}/register`, user, { headers });
  }
  
  // Méthode pour vérifier si un utilisateur existe
checkUserExists(email: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/check-user-exists?email=${email}`);
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

// Méthode pour récupérer l'ID de l'utilisateur à partir du token
getUserId(): string | null {
  const token = this.tokenSubject.value;
  if (token) {
    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.userId; // Assurez-vous que la clé correspond à votre payload JWT
    } catch (error) {
      console.error('Erreur de décodage du token', error);
      return null;
    }
  }
  return null;
}

updateProfile(formData: FormData) {
  const userId = this.getUserId();
  if (!userId) {
    throw new Error('Aucun utilisateur connecté');
  }
  return this.http.put(`${this.apiUrl}/users/${userId}`, formData, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${this.tokenSubject.value}`
    })
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

}