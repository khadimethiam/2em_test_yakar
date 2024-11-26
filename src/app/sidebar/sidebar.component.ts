import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service'; // Adaptez le chemin selon votre projet
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone : true,
  imports: [RouterModule,CommonModule,EditProfileComponent]
})

export class SidebarComponent implements OnInit {
  toggleState: boolean = false;
  user: any = null; // Contiendra les données utilisateur
  isEditProfileModalOpen = false; // Ajoutez cette propriété

  constructor(public authService: AuthService) {}

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

  openEditProfileModal() {
    this.isEditProfileModalOpen = true;
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