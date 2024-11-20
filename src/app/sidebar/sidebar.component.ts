import { Component } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common'; // Importer CommonModule i

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],

  standalone: true,
  imports: [CommonModule],
})
export class SidebarComponent {

  isOn: boolean = false;

  toggleState(): void {
    this.isOn = !this.isOn;
  }

  
  constructor(private authService: AuthService) {}

  onLogout() {
    this.authService.logout();
  }

}
