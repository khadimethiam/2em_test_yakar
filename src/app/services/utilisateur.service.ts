import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {
  private apiUrl = 'http://127.0.0.1:3000'; // URL de l'API backend

  constructor(private http: HttpClient) {}

  // Récupérer les données de l'utilisateur connecté
  getUtilisateurConnecte(): Observable<any> {
    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/me`, { headers });
  }

  // Fonction pour récupérer un utilisateur
  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Modifier un utilisateur
  modifierUtilisateur(id: string, utilisateur: any): Observable<any> {
    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put(`${this.apiUrl}/update/${id}`, utilisateur, { headers });
  }

  //Hacher un mot de passe
  hashP (password: string): Observable<any>{
    return this.http.post(`${this.apiUrl}/hash-password`, password);
  }
  
}