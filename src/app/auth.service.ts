import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

// Service pour récupérer l'utilisateur connecté
getConnectedUser(): Observable<any> {
  const token = this.getToken();
  if (!token) {
    throw new Error('Token manquant, veuillez vous reconnecter.');
  }

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any>(`${this.apiUrl}/me`, { headers }); // Retourne toutes les infos ou seulement userId
}

getUserById(userId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
}

/**
   * Met à jour un utilisateur avec ou sans fichier photo.
   * @param userId - ID de l'utilisateur à mettre à jour.
   * @param updates - Données à mettre à jour.
   * @param photoFile - (Optionnel) Fichier photo de l'utilisateur.
   * @returns Observable contenant la réponse du serveur.
   */
modifierUtilisateur(userId: string, updates: any, photoFile?: File): Observable<any> {
  const formData = new FormData();

  // Ajouter les données au formulaire
  for (const key in updates) {
    if (updates.hasOwnProperty(key)) {
      formData.append(key, updates[key]);
    }
  }

  // Ajouter la photo si elle est fournie
  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const token = localStorage.getItem('token'); // Récupérer le token
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
  });

  // Effectuer la requête PUT
  return this.http.put<any>(`${this.apiUrl}/users/${userId}`, formData, { headers });
}


}