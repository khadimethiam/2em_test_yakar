import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { NgModule } from '@angular/core';
import { RouterModule} from '@angular/router';
import { DashboardSimpleComponent } from './dashboard-simple/dashboard-simple.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginCodeComponent } from './login-code/login-code.component';
import { UpdateComponent } from './update/update.component';
import { MyModalComponent } from './modals/my-modal/my-modal.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login-code', component: LoginCodeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user/edit/:id', component: UpdateComponent },
  { path: 'admin/:id', component: MyModalComponent },
  

  {
    path: 'dashboard-simple',
    component: DashboardSimpleComponent,
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}