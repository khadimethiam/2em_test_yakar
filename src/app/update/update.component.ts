import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import * as bcrypt from 'bcryptjs';



interface User {
  _id: string;
  prenom: string;
  nom: string;
  numero_tel: string;
  email: string;
  status: string;
  password: string;
  role: string;
  photo: string | null;
}

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.css'],
})
export class UpdateComponent implements OnInit {
  showPersonalInfoForm: boolean = true;
  showAccountForm: boolean = false;
  showPassword: boolean = false;
  userId: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  invalidOldPasswordMessage: string = ''; // Message d'erreur spécifique à l'ancien mot de passe


  userPersonalInfo: User = {
    _id: '',
    nom: '',
    prenom: '',
    email: '',
    numero_tel: '',
    status: '',
    password: '',
    role: '',
    photo: null,
  };

  userAccountInfo = {
    oldPassword: '',
    password: '',
    photo: null as File | null,
  };
  

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const userDataString = localStorage.getItem('userToUpdate');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      this.userId = userData._id;
      this.userPersonalInfo = { ...userData, password: '' };
      if (userData.photo) {
        this.userAccountInfo.photo = userData.photo;
      }
    }
  }
  
  onSubmitPersonalInfo() {
    console.log('onSubmitPersonalInfo: Passage au formulaire des informations de compte');
    this.showPersonalInfoForm = false;
    this.showAccountForm = true;
  }

  onSubmitAccountInfo() {
    console.log('onSubmitAccountInfo: Soumission des informations de compte');
    if (this.isSubmitting) {
      console.warn('onSubmitAccountInfo: Soumission déjà en cours');
      return;
    }
    this.isSubmitting = true;
  
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  
    // Vérification de l'ancien mot de passe
    this.http
      .post(`http://localhost:3000/users/verify-password`, {
        userId: this.userId,
        oldPassword: this.userAccountInfo.oldPassword,
      }, { headers })
      .subscribe(
        (response: any) => {
          console.log('Ancien mot de passe validé:', response);
  
          // Hacher le nouveau mot de passe avant de l'envoyer
          const hashedPassword = bcrypt.hashSync(this.userAccountInfo.password, 10);
  
          const formData = new FormData();
          formData.append('nom', this.userPersonalInfo.nom);
          formData.append('prenom', this.userPersonalInfo.prenom);
          formData.append('email', this.userPersonalInfo.email);
          formData.append('numero_tel', this.userPersonalInfo.numero_tel);
          formData.append('password', hashedPassword);
          if (this.userAccountInfo.photo) {
            formData.append('photo', this.userAccountInfo.photo);
          }
  
          this.http.put(`http://localhost:3000/users/${this.userId}`, formData, { headers }).subscribe(
            (updateResponse: any) => {
              console.log('Mise à jour réussie:', updateResponse);
              this.isSubmitting = false;
              this.successMessage = 'Mise à jour réussie.';
              this.router.navigate(['/user-list']);
            },
            (updateError) => {
              console.error('Erreur lors de la mise à jour:', updateError);
              this.isSubmitting = false;
              this.errorMessage = "Une erreur s'est produite.";
            }
          );
        },
        (error) => {
          console.error('Ancien mot de passe invalide:', error);
          this.isSubmitting = false;
          this.errorMessage = 'Ancien mot de passe incorrect.';
          this.invalidOldPasswordMessage = 'Mot de passe incorrect, veuillez réessayer à nouveau.';
        }
      );
  }
  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    console.log('togglePasswordVisibility: Visibilité du mot de passe modifiée', this.showPassword);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('onFileChange: Fichier sélectionné', file);
      this.userAccountInfo.photo = file;
    } else {
      console.warn('onFileChange: Aucun fichier sélectionné');
    }
  }

  cancel() {
    console.log('cancel: Annulation et retour au tableau de bord');
    this.router.navigate(['/user-list']);
  }

  validateNameOrPrenom(value: string): boolean {
    const regex = /^(?!\s)(?!.*\s{2})(?![0-9]*$)[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/; // Pas d'espace initial, pas de double espace, pas seulement des chiffres, caractères valides
    return regex.test(value.trim());
  }
  
  validatePhoneNumber(value: string): boolean {
    const regex = /^(70|75|76|77|78)[0-9]{7}$/; // Doit commencer par 70, 75, 76, 77, 78 et avoir 9 chiffres au total
    return regex.test(value);
  }
  
  validatePassword(value: string): boolean {
    return value.length >= 8; // Longueur minimale de 8 caractères
  }
  
  onNameChange() {
    const isValid = this.validateNameOrPrenom(this.userPersonalInfo.nom);
    this.errorMessage = isValid ? '' : 'Nom invalide. Pas d’espaces initiaux/doubles ou caractères spéciaux.';
  }
  
  onPrenomChange() {
    const isValid = this.validateNameOrPrenom(this.userPersonalInfo.prenom);
    this.errorMessage = isValid ? '' : 'Prénom invalide. Pas d’espaces initiaux/doubles ou caractères spéciaux.';
  }
  
  onPhoneNumberChange() {
    const isValid = this.validatePhoneNumber(this.userPersonalInfo.numero_tel);
    this.errorMessage = isValid ? '' : 'Numéro invalide. Doit commencer par 70, 75, 76, 77 ou 78 et contenir 9 chiffres.';
  }
  
  onNewPasswordChange() {
    const isValid = this.validatePassword(this.userAccountInfo.password);
    this.errorMessage = isValid ? '' : 'Le mot de passe doit contenir au moins 8 caractères.';
  }
  
  validateEmail(value: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Format email standard
    return regex.test(value);
  }
  
  onEmailChange() {
    const isValid = this.validateEmail(this.userPersonalInfo.email);
    this.errorMessage = isValid ? '' : "Veuillez saisir une adresse email valide.";
  }
  
  
}