import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';  // Importer FormsModule
import { CommonModule } from '@angular/common'; // Importer CommonModule ici
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule,SidebarComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  user = {
    nom: '',
    prenom: '',
    email: '',
    numero_tel: '',
    mot_de_passe: '',
    role: '',
    photo: null, // Nouveau champ pour la photo
  };
  errorMessage = '';

  // Contrôles de validation
  nomValid = true;
  prenomValid = true;
  emailValid = true;
  telValid = true;
  motDePasseValid = true;
  roleValid = true;

  nomTouched = false;
  prenomTouched = false;
  emailTouched = false;
  telTouched = false;
  motDePasseTouched = false;
  roleTouched = false;

  // Déclarez les variables pour la force du mot de passe
  passwordStrengthText = '';

  // Tableau de couleurs pour les traits de la force du mot de passe
    passwordStrengthBars = ['', '', '', ''];
 
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const nextButton = document.getElementById('next1')!;
    const prevButton = document.getElementById('prev2')!;
    const step1 = document.getElementById('step1')!;
    const step2 = document.getElementById('step2')!;

    // Afficher l'étape 2 après avoir cliqué sur "Suivant"
    nextButton.addEventListener('click', () => {
      if (this.isStep1Valid()) {
        step1.classList.remove('active');
        step2.classList.add('active');
      }
    });

    // Revenir à l'étape 1 après avoir cliqué sur "Précédent"
    prevButton.addEventListener('click', () => {
      if (this.isStep2Valid()) {
        step2.classList.remove('active');
        step1.classList.add('active');
      } else {
        this.errorMessage = 'Veuillez corriger les erreurs avant de revenir à l\'étape 1';
      }
    });
  }

  // Méthode pour gérer le fichier photo
  onFileChange(event: any): void {
    if (event.target.files && event.target.files[0]) {
      this.user.photo = event.target.files[0]; // Récupérer le fichier photo
    }
  }

  // Validation en temps réel des champs
  validateNom(): void {
    const nomPattern = /^[A-Za-zéèêïîöô]+$/;
    this.nomValid = nomPattern.test(this.user.nom);
  }

  validatePrenom(): void {
    const prenomPattern = /^[A-Za-zéèêïîöô\s]+$/;
    this.prenomValid = prenomPattern.test(this.user.prenom);
  }

  validateEmail(): void {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.emailValid = emailPattern.test(this.user.email);
  }

  validateTel(): void {
    const telPattern = /^[0-9]{10}$/; // Exemple de validation pour un numéro à 10 chiffres
    this.telValid = telPattern.test(this.user.numero_tel);
  }

  validateMotDePasse(): void {
    this.motDePasseValid = this.user.mot_de_passe.length >= 6;
    // Calcul de la force du mot de passe
    this.updatePasswordStrength();
  }

  validateRole(): void {
    this.roleValid = this.user.role !== '';
  }

  // Validation complète de l'étape 1
  isStep1Valid(): boolean {
    this.validateNom();
    this.validatePrenom();
    this.validateEmail();
    this.validateTel();
    return this.nomValid && this.prenomValid && this.emailValid && this.telValid;
  }

  // Validation complète de l'étape 2
  isStep2Valid(): boolean {
    this.validateMotDePasse();
    this.validateRole();
    return this.motDePasseValid && this.roleValid;
  }

  // Méthode pour l'inscription
  onRegister(): void {
    // Validation du mot de passe et du rôle pour l'étape 2
    this.validateMotDePasse();
    this.validateRole();

    if (this.nomValid && this.prenomValid && this.emailValid && this.telValid && this.motDePasseValid && this.roleValid) {
      const formData = new FormData();
      formData.append('nom', this.user.nom);
      formData.append('prenom', this.user.prenom);
      formData.append('email', this.user.email);
      formData.append('numero_tel', this.user.numero_tel);
      formData.append('mot_de_passe', this.user.mot_de_passe);
      formData.append('role', this.user.role);

      if (this.user.photo) {
        formData.append('photo', this.user.photo);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'Vous devez être connecté pour inscrire un utilisateur';
        return;
      }

      // Appel du service d'inscription
      this.authService.register(formData, token).subscribe(
        (res) => {
          console.log("Réponse du serveur:", res);
          this.router.navigate(['/dashboard']); // Redirection après succès
        },
        (err) => {
          console.error("Erreur lors de l'inscription:", err);
          this.errorMessage = err.error.message || 'Une erreur est survenue';
        }
      );
    } else {
      this.errorMessage = 'Veuillez corriger les erreurs avant de soumettre le formulaire';
    }
  }

 // Méthode pour calculer la force du mot de passe
 updatePasswordStrength(): void {
  const password = this.user.mot_de_passe;
  const lengthCriteria = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strength = 0;
  if (lengthCriteria) strength++;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasDigits) strength++;
  if (hasSpecialChars) strength++;

  // Mise à jour des couleurs des barres
  this.passwordStrengthBars = ['', '', '', ''];
  if (strength >= 1) this.passwordStrengthBars[0] = 'weak';
  if (strength >= 2) this.passwordStrengthBars[1] = 'medium';
  if (strength >= 3) this.passwordStrengthBars[2] = 'strong';
  if (strength >= 4) this.passwordStrengthBars[3] = 'very-strong';

  if (strength === 1) {
    this.passwordStrengthText = 'Faible';
  } else if (strength === 2) {
    this.passwordStrengthText = 'Moyenne';
  } else if (strength === 3) {
    this.passwordStrengthText = 'Bonne';
  } else if (strength === 4) {
    this.passwordStrengthText = 'Très Bonne';
  } else {
    this.passwordStrengthText = '';
  }
}

// Méthode pour obtenir la classe CSS de la force du mot de passe
getPasswordStrengthClass(): string {
  return this.passwordStrengthBars.join(' ');
}
}

