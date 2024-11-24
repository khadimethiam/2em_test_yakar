import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from './theme.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavComponent } from './nav/nav.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AppComponent implements OnInit {
  constructor(public themeService: ThemeService) {}

  ngOnInit() {
    // Vous pouvez initialiser le mode ici si nécessaire
  }

  toggleMode() {
    this.themeService.toggleMode();
  }
}
