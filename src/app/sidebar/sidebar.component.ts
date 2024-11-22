import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http'; // Importer HttpClient pour les requêtes HTTP
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports : [CommonModule],
})
export class SidebarComponent {

  isOn: boolean = false;

  constructor(private authService: AuthService, private http: HttpClient) {}

  // Méthode pour basculer l'état du ventilateur et envoyer la requête à l'API
  toggleState(): void {
    this.isOn = !this.isOn; // Inverser l'état du ventilateur

    // Déterminer l'action à envoyer à l'API
    const action = this.isOn ? 'on' : 'off';

    // Envoyer une requête POST à l'API pour contrôler l'état du ventilateur
    this.http.post('http://localhost:3002/api/ventilator', { action }).subscribe(
      (response) => {
        console.log('Réponse du serveur:', response);
      },
      (error) => {
        console.error('Erreur lors de la commande:', error);
        // En cas d'erreur, inverser l'état du ventilateur pour le maintenir synchronisé
        this.isOn = !this.isOn;
      }
    );
  }

  onLogout() {
    this.authService.logout();
  }
}
