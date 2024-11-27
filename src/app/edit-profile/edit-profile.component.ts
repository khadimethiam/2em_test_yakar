import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilisateurService } from '../services/utilisateur.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ CommonModule, FormsModule, ReactiveFormsModule,SidebarComponent],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  @Input() userId!: string; // ID de l'utilisateur pour charger ses données
  @Input() isEditable = false; // Contrôle si le formulaire est en mode édition
  user: any = null;
  userC: any = null;
  

  isLoading = false;
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    // private userService: UtilisateurService,
    private authService: AuthService,private router: Router
    
  ) {
    // Initialise le formulaire avec des validations
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/)]],
      prenom: ['', [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^(70|75|76|77|78)\d{7}$/)]],
      photo: [null]
    });
  }

 // Permet d'activer/désactiver le mode édition
 toggleEditMode() {
  this.isEditable = !this.isEditable;
}

ngOnInit() {
  // Étape 1 : Récupérer l'ID de l'utilisateur connecté
  this.authService.getConnectedUser().subscribe({
    next: (user) => {
      this.userId = user.id; // Supposons que l'API retourne un objet { userId: '...' }
      console.log('ID utilisateur récupéré :', this.userId);

      // Étape 2 : Récupérer les détails de l'utilisateur avec l'ID
      this.loadUserDetails(); // Charge les données utilisateur après récupération de l'ID
    },
    error: (err) => {
      console.error("Erreur lors de la récupération de l'utilisateur connecté :", err);
    },
  });
}

// Charger les détails de l'utilisateur
loadUserDetails() {
  this.authService.getConnectedUser().subscribe({
    next: (user) => {
      this.user = user;
      this.userId = user.id || user.userId || user._id || '';
  
      // Remplir le formulaire avec les données utilisateur
      this.userForm.patchValue({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.numero_tel || user.telephone,
        photo: user.photo,
      });
    },
    error: (err) => {
      console.error("Erreur lors de la récupération de l'utilisateur connecté :", err);
    },
  });
  
}

cancel() {
  console.log('cancel: Annulation et retour au tableau de bord');
  this.router.navigate(['/dashboard']);
}
  saveChanges() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      this.authService.modifierUtilisateur(this.userId, formData).subscribe({
        next: () => {
          console.log('Modifications enregistrées avec succès.');
          this.isEditable = false;
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde des modifications.', err);
        }
      });
    }
  }
}
