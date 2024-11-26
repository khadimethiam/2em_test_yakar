import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service'; // Adaptez le chemin selon votre projet
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // Import de HttpClient pour les requêtes HTTP

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule],
})
export class SidebarComponent implements OnInit {
  toggleState: boolean = false; // État du toggle (false = OFF, true = ON)
  user: any = null; // Contiendra les données utilisateur

  constructor(
    public authService: AuthService,
    private http: HttpClient // Injection d'HttpClient
  ) {}

  ngOnInit(): void {
    // Récupération des données utilisateur
    this.authService.getUserProfile().subscribe(
      (data) => {
        this.user = data;

        // Ajouter l'URL complète pour la photo si elle est définie
        if (this.user.photo) {
          this.user.photo = `http://localhost:3000${this.user.photo}`;
        }
      },
      (error) => {
        console.error(
          'Erreur lors de la récupération des informations utilisateur',
          error
        );
      }
    );
  }

  // Fonction pour basculer l'état du toggle switch et envoyer la commande au serveur
  toggleSwitch() {
    this.toggleState = !this.toggleState; // Basculer l'état du ventilateur

    // Déterminer l'état du ventilateur (ON/OFF)
    const status = this.toggleState ? 'ON' : 'OFF';

    // Appel de l'API pour activer/désactiver le ventilateur
    this.http.post('http://localhost:3000/fan-control', { status }).subscribe(
      (response) => {
        //  console.log(response.message);  Log de la réponse du serveur
      },
      (error) => {
        console.error("Erreur lors de l'activation du ventilateur", error);
      }
    );

    // Modifier l'apparence du toggle switch
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLElement;
    const offIcon = document.getElementById('offIcon') as HTMLImageElement;
    const onIcon = document.getElementById('onIcon') as HTMLImageElement;
    const knob = document.querySelector('.toggle-knob') as HTMLElement;

    // Bascule des images et du déplacement du "knob"
    if (this.toggleState) {
      // Si l'état est ON
      offIcon.style.opacity = '0'; // Cacher l'icône OFF
      onIcon.style.opacity = '1'; // Afficher l'icône ON
      knob.style.transform = 'translateX(100%)'; // Déplacer le "knob" vers la droite
      toggleSwitch.classList.add('active'); // Ajouter la classe "active" pour la couleur verte
    } else {
      // Si l'état est OFF
      offIcon.style.opacity = '1'; // Afficher l'icône OFF
      onIcon.style.opacity = '0'; // Cacher l'icône ON
      knob.style.transform = 'translateX(0)'; // Réinitialiser le "knob" à gauche
      toggleSwitch.classList.remove('active'); // Retirer la classe "active"
    }
  }
}
