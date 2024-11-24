import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router'; // Importer RouterModule et Router
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule], // Ajouter RouterModule ici
})
export class SidebarComponent {
  toggleState: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  // Fonction pour basculer l'état du toggle switch
  toggleSwitch() {
    this.toggleState = !this.toggleState;

    // Récupérer l'élément toggle-switch et l'élément knob
    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLElement;
    const offIcon = document.getElementById('offIcon') as HTMLImageElement;
    const onIcon = document.getElementById('onIcon') as HTMLImageElement;

    // Changer la classe "active" du toggle switch pour changer la couleur et déplacer le knob
    toggleSwitch.classList.toggle('active');

    // Gérer l'opacité des images
    if (this.toggleState) {
      offIcon.style.opacity = '0';
      onIcon.style.opacity = '1';
    } else {
      offIcon.style.opacity = '1';
      onIcon.style.opacity = '0';
    }
  }

  // Fonction pour se déconnecter
  onLogout() {
    this.authService.logout().subscribe(
      () => {
        // Rediriger vers la page de connexion après la déconnexion
        this.router.navigate(['/login']);
      },
      (err) => {
        console.error('Erreur lors de la déconnexion:', err);
      }
    );
  }
}
