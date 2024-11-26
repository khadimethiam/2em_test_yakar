// edit-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class EditProfileComponent implements OnInit {
  editProfileForm: FormGroup;
  user: any = {};
  selectedFile: File | null = null;
  previewImage: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService
  ) {
    this.editProfileForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      numero_tel: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      photo: [null]
    });
  }

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur
    this.authService.getUserProfile().subscribe(
      (data) => {
        this.user = data;
        
        // Pré-remplir le formulaire
        this.editProfileForm.patchValue({
          nom: this.user.nom,
          prenom: this.user.prenom,
          email: this.user.email,
          numero_tel: this.user.numero_tel
        });

        // Définir l'image de prévisualisation
        if (this.user.photo) {
          this.previewImage = this.user.photo;
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération du profil', error);
      }
    );
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Prévisualisation de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result ?? null;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.editProfileForm.valid) {
      const formData = new FormData();
      
      // Ajouter les champs du formulaire
      Object.keys(this.editProfileForm.controls).forEach(key => {
        if (key !== 'photo') {
          formData.append(key, this.editProfileForm.get(key)?.value);
        }
      });

      // Ajouter le fichier photo s'il est sélectionné
      if (this.selectedFile) {
        formData.append('photo', this.selectedFile);
      }

      // Appeler le service pour mettre à jour le profil
      this.authService.updateProfile(formData).subscribe(
        (response) => {
          console.log('Profil mis à jour avec succès', response);
          // Optionnel : afficher un message de succès
          // Optionnel : fermer la modal
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du profil', error);
          // Optionnel : afficher un message d'erreur
        }
      );
    }
  }
}