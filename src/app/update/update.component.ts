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

  
}
