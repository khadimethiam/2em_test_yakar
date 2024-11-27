
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importez CommonModule
import { UtilisateurService } from '../../services/utilisateur.service';
import { AuthService } from '../../auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-my-modal',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './my-modal.component.html',
  styleUrl: './my-modal.component.css'
})
export class MyModalComponent implements OnInit {
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  userForm: FormGroup;
 
  userId: string;


  
  constructor(
    private fb: FormBuilder,
    private userService: UtilisateurService,
    private userAuth: AuthService,
    private route: ActivatedRoute,
    private router: Router,

    
  ) {
    // Configuration du formulaire avec validation
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/)]],
      prenom: ['', [Validators.required, Validators.pattern(/^(?!\s)(?!.*\s\s)[a-zA-Z\s]*$/)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^(70|75|76|77|78)\d{7}$/)]],
      photo: [null]
      
    });
    this.userId = '';
  }


  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    const user = this.userService.getUserById(this.userId);
    this.userForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required]
    });

    this.loadUser();
    this.openModal();
  }
  
  loadUser() {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    this.isLoading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.numero_tel,
          photo: user.photo,
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditing = false;
    this.userForm.reset();
  }

  toggleEditing() {
    this.isEditing = true;
  }

  saveChanges() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      this.userService.modifierUtilisateur(this.userId, formData);
      this.isEditing = false;
      this.closeModal();
    }
  }
}
