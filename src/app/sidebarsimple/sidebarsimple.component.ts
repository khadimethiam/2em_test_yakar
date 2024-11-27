import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebarsimple',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebarsimple.component.html',
  styleUrl: './sidebarsimple.component.css',
})
export class SidebarsimpleComponent implements OnInit {
  toggleState: boolean = false;
  user: any = null; // Contiendra les données utilisateur

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Récupération des données utilisateur
    this.authService.getConnectedUser().subscribe(
      (user) => {
        this.user = user;

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

  // Fonction pour basculer l'état du toggle switch
  toggleSwitch() {
    this.toggleState = !this.toggleState;

    const toggleSwitch = document.getElementById('toggleSwitch') as HTMLElement;
    const offIcon = document.getElementById('offIcon') as HTMLImageElement;
    const onIcon = document.getElementById('onIcon') as HTMLImageElement;

    toggleSwitch.classList.toggle('active');

    if (this.toggleState) {
      offIcon.style.opacity = '0';
      onIcon.style.opacity = '1';
    } else {
      offIcon.style.opacity = '1';
      onIcon.style.opacity = '0';
    }
  }
}
