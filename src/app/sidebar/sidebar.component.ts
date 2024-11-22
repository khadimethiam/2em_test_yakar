import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  // Importer RouterModule

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [RouterModule]  // Ajouter RouterModule ici
})
export class SidebarComponent {
  toggleState: boolean = false;

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
}
