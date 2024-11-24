import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilisateurService } from '../services/utilisateur.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../success.component';

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css',
})
export class UpdateComponent implements OnInit {
  userForm: FormGroup;
  userId: string;
  isLoading = false;
  fileName: string | null = null;
  photoPreview: string | null = null;
  fileError: string | null = null;

  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private userService: UtilisateurService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {
    // Configuration du formulaire avec validation
    this.userForm = this.fb.group({
      nom: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/),
        ],
      ],
      prenom: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      telephone: [
        '',
        [Validators.required, Validators.pattern(/^(70|75|76|77|78)\d{7}$/)],
      ],
      role: ['', [Validators.required]],
      motDePasse: ['', Validators.minLength(8)], // Validation de mot de passe
      photo: [null],
    });
    this.userId = '';
  }

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.fileName = element.files[0].name;
    } else {
      this.fileName = null;
    }
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    this.userForm = this.fb.group({
      nom: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/),
        ],
      ],
      prenom: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      telephone: [
        '',
        [Validators.required, Validators.pattern(/^(70|75|76|77|78)\d{7}$/)],
      ],
      motDePasse: ['', Validators.minLength(8)], // Validation de mot de passe
      role: ['', Validators.required],
    });

    // Charger les données de l'utilisateur
    this.loadUser();
  }

  openSuccessDialog() {
    this.dialog.open(SuccessDialogComponent, {
      width: '400px',
      disableClose: true, // Empêche la fermeture en cliquant en dehors
      hasBackdrop: true, // Active l’arrière-plan
      panelClass: 'custom-dialog', // Classe CSS personnalisée
    });
  }
  passwordVisible = false;
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
  // Chargement des données de l'utilisateur
  loadUser() {
    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.numero_tel,
          role: user.role,
          photo: user.photo,
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  // Validation des fichiers photo
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'Le fichier doit être inférieur à 5 Mo.';
        this.fileName = null;
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.fileError = 'Seules les images sont autorisées (png, jpeg, etc.).';
        this.fileName = null;
        return;
      }

      this.fileName = file.name;
      this.fileError = null;
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  motDePasseVisible: boolean = false;

  toggleMotDePasse(): void {
    const input = document.getElementById('motDePasse') as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  // Annuler la modification
  onCancel() {
    this.router.navigate(['/login']);
  }

  // Soumission du formulaire
  onSubmit() {
    const formData = this.userForm.value;

    if (!formData.motDePasse) {
      // Supprimez le champ si l'utilisateur n'a pas saisi un nouveau mot de passe
      delete formData.motDePasse;
    }

    this.userService.modifierUtilisateur(this.userId, formData).subscribe({
      next: () => this.openSuccessDialog(),
      error: () => alert('Erreur lors de la mise à jour.'),
    });
  }

  // Vérification si un champ est invalide et touché
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!field?.invalid && (!!field.dirty || !!field.touched);
  }

  getErrorMessage(fieldName: string): string | null {
    const field = this.userForm.get(fieldName);
    if (!field) return null;

    if (fieldName === 'motDePasse' && field.errors?.['minlength']) {
      return `Le mot de passe doit contenir au moins ${field.errors['minlength'].requiredLength} caractères.`;
    }

    console.log(`${fieldName} errors:`, field.errors);

    if (field.errors?.['required']) return 'Ce champ est obligatoire.';

    if (field.errors?.['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Ce champ doit contenir au moins ${minLength} caractères.`;
    }

    if (field.errors?.['email'])
      return 'Veuillez entrer une adresse e-mail valide.';

    if (field.errors?.['pattern']) {
      // Gestion spécifique des patterns selon le champ
      switch (fieldName) {
        case 'nom':
          return 'Ce champ ne peut contenir que des lettres et des espaces sans espaces consécutifs.';
        case 'prenom':
          return 'Ce champ ne peut contenir que des lettres et des espaces sans espaces consécutifs.';
        case 'telephone':
          return 'Le numéro de téléphone doit être valide et commencer par 70, 75, 76, 77 ou 78.';
        default:
          return 'Le format de ce champ est invalide.';
      }
    }

    return null;
  }
}
