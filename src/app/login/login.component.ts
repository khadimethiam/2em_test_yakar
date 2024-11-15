import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class LoginComponent {
  user = { email: '', mot_de_passe: '' };
  errorMessage = '';
  focusState: { [key: string]: boolean } = { username: false, password: false };

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
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
        this.errorMessage = 'Erreur lors de la connexion';
      }
    );
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
