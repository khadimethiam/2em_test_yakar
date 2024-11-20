import { Component } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],

  standalone: true,
})
export class SidebarComponent {


  
  constructor(private authService: AuthService) {}

  onLogout() {
    this.authService.logout();
  }

}
