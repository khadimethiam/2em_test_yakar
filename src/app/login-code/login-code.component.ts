import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';  // Importation de FormsModule pour utiliser ngModel

@Component({
  selector: 'app-login-code',
  standalone: true,
  imports: [FormsModule],  // Ajout de FormsModule ici pour que ngModel fonctionne
  templateUrl: './login-code.component.html',
  styleUrls: ['./login-code.component.css']
})
export class LoginCodeComponent {
  code: string[] = ['', '', '', '']; // Exemple de tableau pour le code
  errorMessage: string | null = null;

  onInput(event: any, i: number): void {
    console.log('Input event:', event);
    // Logique pour la gestion de l'input
  }

  onKeydown(event: KeyboardEvent, i: number): void {
    console.log('Keydown event:', event);
    // Logique pour la gestion de la touche pressée
  }

  switchToLogin(): void {
    console.log('Switch to login');
    // Logique pour basculer vers la page de connexion
  }

  onLogin(): void {
    console.log('Login attempted');
    // Logique pour la gestion de la soumission du formulaire de connexion
  }
}
