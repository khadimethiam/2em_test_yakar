import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) { }

  // Ajouter un utilisateur
  addUser(user: any): Observable<any> {
    const token = localStorage.getItem('token'); // Récupérer le token du localStorage
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Ajouter le token à l'en-tête
    });

    return this.http.post(this.apiUrl, user, { headers });
  }
  
  // Obtenir tous les utilisateurs
  getUsers(): Observable<any[]> {
    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Ajouter le token à l'en-tête
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }
  
  // Mettre à jour un utilisateur
  updateUser(userId: string, user: any): Observable<any> {
    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Ajouter le token à l'en-tête
    });

    return this.http.put(`${this.apiUrl}/${userId}`, user, { headers });
  }

  // Supprimer un utilisateur
  deleteUser(userId: string): Observable<any> {
    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Ajouter le token à l'en-tête
    });

    return this.http.delete(`${this.apiUrl}/${userId}`, { headers });
  }
}
