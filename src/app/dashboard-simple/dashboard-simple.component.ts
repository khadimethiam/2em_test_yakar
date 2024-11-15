import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { SidebarsimpleComponent } from '../sidebarsimple/sidebarsimple.component';

@Component({
  selector: 'app-dashboard-simple',
  templateUrl: './dashboard-simple.component.html',
  styleUrls: ['./dashboard-simple.component.css'],
  standalone: true,
  imports: [CommonModule, SidebarsimpleComponent],
})
export class DashboardSimpleComponent implements OnInit {
  // Logique pour le dashboard simple
  humidity: string = '--'; // Variable pour stocker l'humidité
  humidityData: number[] = [60, 65, 70, 75, 68, 72, 74, 80, 90, 100]; // Exemple de données pour l'humidité
  currentDateTime: string = ''; // Variable pour stocker la date et l'heure actuelles

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.createChart();
    this.getHumidity(); // Récupère l'humidité
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000); // Met à jour la date et l'heure chaque seconde
  }

  // Méthode pour mettre à jour la date et l'heure actuelles
  updateDateTime() {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // Méthode pour créer le graphique avec la température et l'humidité
  createChart() {
    const ctx = document.getElementById(
      'temperatureChart'
    ) as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Température (°C)',
            data: [24, 25, 23, 22, 24, 26, 27],
            borderColor: 'rgb(255, 99, 132)',
            fill: false,
          },
          {
            label: 'Humidité (%)', // Ajout du dataset pour l'humidité
            data: this.humidityData, // Utilise le tableau d'humidité
            borderColor: 'rgb(54, 162, 235)',
            fill: false,
          },
        ],
      },
    });
  }

  // Méthode pour récupérer l'humidité depuis l'API
  getHumidity() {
    this.http
      .get<{ value: string }>('http://localhost:3001/api/data')
      .subscribe(
        (response) => {
          this.humidity = response.value; // Met à jour la variable d'humidité
        },
        (error) => {
          console.error("Erreur lors de la récupération de l'humidité", error);
        }
      );
  }
}
