import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeypadService } from '../keypad.service';
import { io } from 'socket.io-client';

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
  errorMessages = { email: '', mot_de_passe: '' };
  focusState: { [key: string]: boolean } = { username: false, password: false };
  socket: any;
  private keypadInputHandled = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private keypadService: KeypadService
  ) {}

  ngOnInit() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.io');
    });
    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.io');
    });
    this.socket.on('keypad-input', (data: string) => {
      console.log('Données du keypad reçues:', data);
      this.handleKeypadInput(data);
    });
  }

  ngOnDestroy() {
    this.socket.off('keypad-input');
  }

  handleKeypadInput(data: string) {
    if (!this.keypadInputHandled) {
      this.keypadInputHandled = true;
      console.log('Key pressed:', data);
      if (data && data.match(/[0-9]/)) {
        this.keypadService.updateKeypadInput(data);
        console.log('Navigating to login-code');
        this.router.navigate(['/login-code']);
      }
    }
  }

  onLogin() {
    this.errorMessages = { email: '', mot_de_passe: '' };
    if (!this.user.email) {
      this.errorMessages.email = "Le nom d'utilisateur est requis.";
    } else if (!this.isValidEmail(this.user.email)) {
      this.errorMessages.email = "Format d'email invalide.";
    }
    if (!this.user.mot_de_passe) {
      this.errorMessages.mot_de_passe = 'Le mot de passe est requis.';
    } else if (this.errorMessages.email || this.errorMessages.mot_de_passe) {
      return;
    }

    this.authService.checkUserExists(this.user.email).subscribe(
      (response) => {
        if (!response.exists) {
          this.errorMessages.email = "Cet utilisateur n'existe pas.";
          return;
        }

        this.authService.login(this.user).subscribe(
          (res) => {
            if (res.token) {
              localStorage.setItem('token', res.token);
              const role = this.getRoleFromToken(res.token);
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
            if (err.status === 403) {
              this.errorMessage =
                "Votre compte est inactif. Veuillez contacter l'administrateur.";
            } else {
              this.errorMessage = 'Erreur lors de la connexion';
            }
          }
        );
      },
      (err) => {
        console.error(err);
        this.errorMessage = "Erreur lors de la vérification de l'utilisateur";
      }
    );
  }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  isValidPassword(password: string): boolean {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordPattern.test(password);
  }

  getRoleFromToken(token: string): string {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  }

  setFocus(field: string) {
    this.focusState[field] = true;
  }

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
