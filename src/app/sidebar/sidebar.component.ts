import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule],
})
export class SidebarComponent implements OnInit, OnDestroy {
  toggleState: boolean = false; // État du toggle (false = OFF, true = ON)
  user: any = null; // Contiendra les données utilisateur
  private refreshInterval: any; // Variable pour stocker l'intervalle de rafraîchissement
  userId: string = '';
  constructor(public authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    // Récupérer l'état actuel du ventilateur dès l'initialisation
    this.getFanState();

    // Démarrer un intervalle pour récupérer périodiquement l'état du ventilateur
    this.refreshInterval = setInterval(() => {
      this.getFanState(); // Rafraîchit l'état du ventilateur
    }, 5000); // Rafraîchit toutes les 5 secondes (modifiable selon tes besoins)

    // Récupération des données utilisateur
    this.authService.getConnectedUser().subscribe({
      next: (user) => {
        this.user = user;

        this.user.photo =
          user.photo === null
            ? 'http://localhost:3000${user.photo}'
            : 'images/profil.png';
      },
      error: (err) => {
        console.error(
          'Erreur lors de la récupération des informations utilisateur',
          err
        );
      },
    });
  }

  // Fonction pour récupérer l'état actuel du ventilateur depuis le serveur
  getFanState() {
    this.http.get<any>('http://localhost:3000/fan-status').subscribe(
      (response) => {
        if (response && response.status) {
          this.toggleState = response.status === 'ON'; // Met à jour l'état du toggle
          this.updateToggleUI(); // Met à jour l'UI du toggle
        } else {
          console.error("Réponse invalide reçue pour l'état du ventilateur");
        }
      },
      (error) => {
        console.error(
          "Erreur lors de la récupération de l'état du ventilateur",
          error
        );
      }
    );
  }

  // Fonction pour basculer l'état du toggle switch et envoyer la commande au serveur
  toggleSwitch() {
    this.toggleState = !this.toggleState; // Basculer l'état du ventilateur
    const status = this.toggleState ? 'ON' : 'OFF';

    this.http.post('http://localhost:3000/fan-control', { status }).subscribe(
      (response) => {
        // Traiter la réponse du serveur si nécessaire
      },
      (error) => {
        console.error("Erreur lors de l'activation du ventilateur", error);
      }
    );

    this.updateToggleUI(); // Mettre à jour l'UI après basculement
  }

  // Fonction pour mettre à jour l'interface graphique du toggle switch
  updateToggleUI() {
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLElement;
    const offIcon = document.getElementById('offIcon') as HTMLImageElement;
    const onIcon = document.getElementById('onIcon') as HTMLImageElement;
    const knob = document.querySelector('.toggle-knob') as HTMLElement;

    if (this.toggleState) {
      offIcon.style.opacity = '0'; // Cacher l'icône OFF
      onIcon.style.opacity = '1'; // Afficher l'icône ON
      knob.style.transform = 'translateX(100%)'; // Déplacer le "knob" à droite
      toggleSwitch.classList.add('active'); // Ajouter la classe active pour la couleur verte
    } else {
      offIcon.style.opacity = '1'; // Afficher l'icône OFF
      onIcon.style.opacity = '0'; // Cacher l'icône ON
      knob.style.transform = 'translateX(0)'; // Réinitialiser le "knob" à gauche
      toggleSwitch.classList.remove('active'); // Retirer la classe active
    }
  }

  // Méthode pour arrêter l'intervalle lors de la destruction du composant
  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval); // Arrêter l'intervalle pour éviter les fuites de mémoire
    }
  }
}
