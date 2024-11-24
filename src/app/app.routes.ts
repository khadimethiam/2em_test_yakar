import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { DashboardSimpleComponent } from './dashboard-simple/dashboard-simple.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginCodeComponent } from './login-code/login-code.component';
import { UserListComponent } from './user-list/user-list.component';
import { HostListener } from '@angular/core';
import { UpdateComponent } from './update/update.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login-code', component: LoginCodeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user-list', component: UserListComponent },
  {path: 'update',component:UpdateComponent},

  {
    path: 'dashboard-simple',
    component: DashboardSimpleComponent,
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
