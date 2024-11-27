import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';

import * as bootstrap from 'bootstrap';
import { Router } from '@angular/router';

interface User {
  prenom: string;
  nom: string;
  numero_tel: string;
  email: string;
  status: string; // Le statut est maintenant dynamique, basé sur la base de données
  password: string;
  role: string;
  photo: string | null; // URL de la photo
  _id?: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})


export class UserListComponent {
  showAccountForm: boolean = false;
  showPersonalInfoForm: boolean = false;
  users: User[] = [];
  filteredUsers: User[] = []; // Liste filtrée des utilisateurs
  roles: string[] = ['all', 'admin', 'user']; // Liste des rôles pour le filtre
  userToDeactivate: User | null = null; // Utilisateur sélectionné pour la désactivation
  selectedUser: User | null = null; // Utilisateur sélectionné pour bloquer ou modifier
  searchPhone: string = ''; // Valeur du champ de recherche par numéro de téléphone
  showPassword = false; // Par défaut, le mot de passe est masqué
  displayedUsers: User[] = [];
  searchNotFoundMessage: string = '';
  activeFilter: string = 'all'; // Par défaut, 'all' (tous les utilisateurs)



  userPersonalInfo: User = {
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
    password: '',
    role: '',
    photo: null,
  };

  currentPage: number = 1; // Page actuelle
  itemsPerPage: number = 8; // Nombre d'utilisateurs par page
  totalItems: number = 0; // Nombre total d'utilisateurs
  totalPages: number = 0; // Nombre total de pages

  constructor(private http: HttpClient,private router: Router) {}

  navigateToUpdate() {
    this.router.navigate(['/update']);
  }

  ngOnInit() {
    this.getUsers(); // Charger les utilisateurs au démarrage
  }


  editUser(user: User) {
    // Stocker l'utilisateur à modifier
    localStorage.setItem('userToUpdate', JSON.stringify(user));
    // Utiliser une seule route cohérente
    this.router.navigate(['/update']); 
  }
  
 
  // Méthode pour récupérer la liste des utilisateurs depuis l'API
  getUsers() {
    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`, // Ajouter le token aux en-têtes
    });

    this.http
      .get<User[]>('http://localhost:3000/api/users', { headers })
      .subscribe(
        (response) => {
          this.users = response; // La liste des utilisateurs avec statut est récupérée
          this.filteredUsers = response; // Par défaut, on affiche tous les utilisateurs
          this.totalItems = response.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage); // Calcul du nombre total de pages
          this.paginateUsers(); // Appel pour la pagination
        },
        (error) => {
          console.error(
            'Erreur lors de la récupération des utilisateurs',
            error
          );
        }
      );
  }

  // Filtrer les utilisateurs en fonction de leur rôle
  filterUsers(role: string) {
    this.activeFilter = role; // Mettez à jour l'état du filtre actif

    if (role === 'user') {
      this.filteredUsers = this.users.filter((user) => user.role === 'user');
    } else if (role === 'admin') {
      this.filteredUsers = this.users.filter((user) => user.role === 'admin');
    } else {
      this.filteredUsers = [...this.users]; // Réinitialise aux utilisateurs complets
    }
  
    // Mise à jour de la pagination
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1; // Revenir à la première page après un changement de filtre
    this.paginateUsers(); // Appliquer la pagination sur les utilisateurs filtrés
  }
  

  // Gérer la pagination et afficher les utilisateurs de la page actuelle
  paginateUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginated = this.filteredUsers.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
    this.displayedUsers = paginated; // Utilisez une nouvelle variable pour afficher les utilisateurs
  }

  // Naviguer vers une page spécifique
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateUsers(); // Met à jour les utilisateurs affichés
    }
  }

  // Passer à la page suivante
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateUsers();
    }
  }

  // Passer à la page précédente
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateUsers();
    }
  }

  // Affiche les formulaires pour ajouter un utilisateur
  onAddUser() {
    this.showPersonalInfoForm = true;
    this.showAccountForm = false;
  }

  // Réinitialise les formulaires
  cancel() {
    this.showPersonalInfoForm = false;
    this.showAccountForm = false;
    this.userPersonalInfo = {
      nom: '',
      prenom: '',
      email: '',
      numero_tel: '',
      status: '',
      password: '',
      role: '',
      photo: null,
    };
    this.userAccountInfo = { password: '', role: '', photo: null };
  }

  // Passe au formulaire des informations de compte
  onNextForm() {
    this.showPersonalInfoForm = false;
    this.showAccountForm = true;
  }

  // Valide et passe à la suite sans enregistrer au serveur
  onSubmitPersonalInfo() {
    if (
      !this.userPersonalInfo.nom ||
      !this.userPersonalInfo.email ||
      !this.userPersonalInfo.numero_tel
    ) {
      alert('Veuillez remplir toutes les informations personnelles');
      return;
    }
    this.onNextForm();
  }

  generateSecretCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Génère un code à 6 chiffres
  }
  secretCode: string = '';

  // Enregistre les informations personnelles et de compte
  onSubmitAccountInfo() {
    if (!this.userAccountInfo.password || !this.userAccountInfo.role) {
      alert('Veuillez remplir les informations de compte');
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.userPersonalInfo.nom);
    formData.append('prenom', this.userPersonalInfo.prenom);
    formData.append('email', this.userPersonalInfo.email);
    formData.append('numero_tel', this.userPersonalInfo.numero_tel);
    formData.append('mot_de_passe', this.userAccountInfo.password || '');
    formData.append('role', this.userAccountInfo.role);
    formData.append('status', 'actif'); // Définit le statut à "Active" par défaut

    if (this.userAccountInfo.photo) {
      formData.append('photo', this.userAccountInfo.photo);
    }

    const token = localStorage.getItem('token'); // Récupérer le token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`, // Ajouter le token aux en-têtes
    });

    this.http
      .post('http://localhost:3000/register', formData, { headers })
      .subscribe(
        (response) => {
          console.log('Utilisateur enregistré');
          // Générer un code secret après l'enregistrement
          const secretCode = this.generateSecretCode();
          console.log('Code secret généré: ', secretCode); // Vous pouvez aussi le garder dans un log si nécessaire

          this.showSuccessMessage = true; // Affichage du message de succès
          this.successMessage = `Utilisateur ajouté avec succès. Code secret: ${secretCode}`;
          setTimeout(() => {
            this.showSuccessMessage = false; // Cache le message après 10 secondes
          }, 10000);
          this.cancel();
          this.getUsers(); // Récupère à nouveau la liste des utilisateurs après ajout
        },
        (error) => {
          console.error(
            "Erreur lors de l'enregistrement de l'utilisateur",
            error
          );
        }
      );
  }

  // Gère le changement de photo de profil
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.userAccountInfo.photo = file;
    }
  }

  // Gère le changement de rôle via le switch
  onRoleChange(user: User, event: any) {
    const updatedRole = event.target.checked ? 'admin' : 'user';
    user.role = updatedRole; // Mise à jour du rôle dans le modèle local

    const token = localStorage.getItem('token'); // Récupérer le token JWT de l'utilisateur
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`, // Ajouter le token d'autorisation dans les en-têtes
    });

    // Appel PUT pour mettre à jour le rôle de l'utilisateur dans la base de données
    this.http
      .put(
        `http://localhost:3000/api/users/${user._id}/role`,
        { role: updatedRole },
        { headers }
      )
      .subscribe(
        (response) => {
          // Réponse de la mise à jour
          console.log('Rôle mis à jour avec succès');
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du rôle', error);
          // Si une erreur survient (par exemple, un problème avec l'API), on réinitialise le rôle local
          user.role = user.role === 'admin' ? 'user' : 'admin'; // Réinitialiser si une erreur se produit
        }
      );
  }
  // Success message properties
  showSuccessMessage: boolean = false;
  successMessage: string = '';

  // Méthode pour ouvrir le modal de confirmation
  onStatusChange(user: User) {
    this.userToDeactivate = user; // Sauvegarder l'utilisateur à désactiver
    const modal = new bootstrap.Modal(
      document.getElementById('confirmationModal')!
    );
    modal.show(); // Afficher le modal de confirmation
  }

  // Méthode pour confirmer le changement de statut
  confirmStatusChange() {
    if (this.userToDeactivate) {
      const updatedStatus =
        this.userToDeactivate.status === 'actif' ? 'inactif' : 'actif';
      this.userToDeactivate.status = updatedStatus; // Mise à jour du statut localement

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      // Mise à jour du statut dans la base de données
      this.http
        .put(
          `http://localhost:3000/api/users/${this.userToDeactivate._id}/status`,
          { status: updatedStatus },
          { headers }
        )
        .subscribe(
          (response) => {
            console.log('Statut mis à jour avec succès');
            this.userToDeactivate = null; // Réinitialiser l'utilisateur à null

            // Fermer le modal de confirmation
            const modalElement = document.getElementById('confirmationModal');
            if (modalElement) {
              const modal = bootstrap.Modal.getInstance(modalElement);
              if (modal) {
                modal.hide(); // Fermer le modal
              } else {
                console.error('Erreur: Instance de modal introuvable.');
              }
            } else {
              console.error('Erreur: Modal non trouvé dans le DOM.');
            }
          },
          (error) => {
            console.error('Erreur lors de la mise à jour du statut', error);
            // Réinitialisation du statut en cas d'erreur
            this.userToDeactivate!.status =
              this.userToDeactivate!.status === 'actif' ? 'inactif' : 'actif';
            this.userToDeactivate = null;
          }
        );
    }
  }

  // Optionnel : Méthode pour annuler l'action
  cancelStatusChange() {
    this.userToDeactivate = null; // Réinitialiser l'utilisateur sélectionné pour la désactivation

    // Trouver l'élément du modal
    const modalElement = document.getElementById('confirmationModal');
    if (modalElement) {
      // Récupérer l'instance du modal
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide(); // Fermer le modal sans effectuer de changement
      } else {
        console.error('Erreur: Instance de modal introuvable.');
      }
    } else {
      console.error('Erreur: Modal non trouvé dans le DOM.');
    }
  }
  onSearchPhone() {
    // Réinitialiser le message de recherche non trouvé
    this.searchNotFoundMessage = '';
  
    if (this.searchPhone.trim() === '') {
      // Si la recherche est vide, on affiche tous les utilisateurs
      this.filteredUsers = this.users;
    } else {
      // Filtrer les utilisateurs en fonction du numéro de téléphone
      this.filteredUsers = this.users.filter((user) =>
        user.numero_tel.includes(this.searchPhone)
      );
    }
  
    // Si aucun utilisateur n'a été trouvé après le filtrage
    if (this.filteredUsers.length === 0) {
      this.searchNotFoundMessage = 'Aucun utilisateur trouvé avec ce numéro de téléphone.';
    }
  
    // Met à jour la pagination
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1; // Remet à zéro la pagination
    this.paginateUsers(); // Applique la pagination après le filtrage
  }
  

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Bascule l'état de visibilité
  }

  // Génère les numéros de pages pour la pagination
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}