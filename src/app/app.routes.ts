import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardSimpleComponent } from './dashboard-simple/dashboard-simple.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginCodeComponent } from './login-code/login-code.component';
import { UserListComponent } from './user-list/user-list.component';
import { HostListener } from '@angular/core';
import { UpdateComponent } from './update/update.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login-code', component: LoginCodeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user-list', component: UserListComponent },  // Route pour afficher la liste des utilisateurs
  
  // Route pour le dashboard simple
  {
    path: 'dashboard-simple',
    component: DashboardSimpleComponent,
  },
  
  // Redirection vers la page de login par défaut
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Ajout d'une route 404 pour gérer les erreurs de navigation
  { path: '**', redirectTo: '/login' }  // Redirection vers la page de login si la route est introuvable
];
