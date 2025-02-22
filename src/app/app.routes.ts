import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { DashboardSimpleComponent } from './dashboard-simple/dashboard-simple.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginCodeComponent } from './login-code/login-code.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login-code', component: LoginCodeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },

  {
    path: 'dashboard-simple',
    component: DashboardSimpleComponent,
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
