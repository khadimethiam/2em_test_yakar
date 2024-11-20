import { Component } from '@angular/core';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-sidebarsimple',
  standalone: true,
  imports: [],
  templateUrl: './sidebarsimple.component.html',
  styleUrl: './sidebarsimple.component.css'
})
export class SidebarsimpleComponent {
  constructor(private authService: AuthService) {}

  onLogout() {
    this.authService.logout();
  }

}
