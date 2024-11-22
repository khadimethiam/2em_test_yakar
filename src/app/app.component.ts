import { Component, OnInit } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { ThemeService } from './theme.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


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
    // Activer les tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
  }

  toggleMode() {
    this.themeService.toggleMode();
  }
}
