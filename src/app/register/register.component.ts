import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class RegisterComponent {
  user = {
    nom: '',
    prenom: '',
    email: '',
    numero_tel: '',
    mot_de_passe: '',
    role: '',
  };
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    const token = localStorage.getItem('authToken'); // Ou une autre méthode pour récupérer le token

    if (token) {
      this.authService.register(this.user, token).subscribe(
        (res) => {
          if (typeof res === 'object' && res.message) {
            this.router.navigate(['/login']);
          } else {
            this.errorMessage = "Erreur lors de l'inscription";
          }
        },
        (err) => {
          console.error(err);
          this.errorMessage = "Erreur lors de l'inscription";
        }
      );
    } else {
      this.errorMessage = 'Token introuvable. Veuillez vous reconnecter.';
    }
  }
}
