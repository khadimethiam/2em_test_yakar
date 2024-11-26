import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';  // Vérifiez que ce chemin est correct

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  user = { email: '', mot_de_passe: '' };
  errorMessage = '';
  focusState: { [key: string]: boolean } = { username: false, password: false };

  // Ajoutez une variable pour stocker la touche pressée
  lastKeyPressed: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Écouter l'événement "key-pressed" depuis le service WebSocket
    this.socketService.listenToKeyPress((key: string) => {
      this.lastKeyPressed = key;
      
      // Ajouter la touche pressée à l'email ou au mot de passe en fonction du champ actif
      if (this.focusState['username']) {  // Utilisation de la notation par crochet
        this.user.email += key;  // Ajouter la touche à l'email
      } else if (this.focusState['password']) {  // Utilisation de la notation par crochet
        this.user.mot_de_passe += key;  // Ajouter la touche au mot de passe
      }
    });
  }

  ngOnDestroy(): void {
    // Déconnecter le service WebSocket lorsque le composant est détruit
    this.socketService.disconnect();
  }

  // Fonction pour traiter la connexion
  onLogin() {
    this.authService.login(this.user).subscribe(
      (res) => {
        if (res.token) {
          localStorage.setItem('token', res.token);  // Sauvegarde du token
          const role = this.getRoleFromToken(res.token);
          // Naviguer en fonction du rôle
          if (role === 'admin') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/dashboard-simple']);
          }
        } else {
          this.errorMessage = 'Erreur lors de la connexion';
        }
      },
      (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la connexion';
      }
    );
  }
   // Fonction pour gérer les événements de clavier (ex. Backspace)
  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && index > 0) {
      const previousField = document.querySelector<HTMLInputElement>(`input[name='code${index - 1}']`);
      previousField?.focus();
    }
  }

  // Fonction pour extraire le rôle à partir du token JWT
  getRoleFromToken(token: string): string {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  }

  // Fonction pour mettre le focus sur un champ (email ou mot de passe)
  setFocus(field: string) {
    this.focusState[field] = true;
  }

  // Fonction pour retirer le focus d'un champ
  removeFocus(field: string) {
    this.focusState[field] = false;
  }

  switchToLoginCode() {
    this.router.navigate(['/login-code']);
  }

  signInWithGoogle() {
    // Implémentez la logique de connexion avec Google
  }

  signInWithFacebook() {
    // Implémentez la logique de connexion avec Facebook
  }
}
