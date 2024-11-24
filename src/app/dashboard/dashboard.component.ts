import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavComponent } from '../nav/nav.component';
import { Chart } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [SidebarComponent, NavComponent, CommonModule],
})
export class DashboardComponent implements OnInit {
  // Variables pour l'humidité
  humidity: string = '--%';
  humidity_moy: string = '--%';
  humidity_mat: string = '--%';
  humidity_midi: string = '--%';
  humidity_soir: string = '--%';
  humidity_23h10: string = '--%';
  humidity_23h05: string = '--%';
  humidity_23h14: string = '--%';

  // Variables pour la température
  temperature: string = '--°C';
  temperatureClass: string = '';
  temperature_moy: string = '--°C';
  temperature_mat: string = '--°C';
  temperature_midi: string = '--°C';
  temperature_soir: string = '--°C';
  temperature_23h10: string = '--°C';
  temperature_23h05: string = '--°C';
  temperature_23h14: string = '--°C';

  // Tableaux pour stocker les données de la semaine
  weeklyHumidity: number[] = [40, 50, 60, 65, 70, 75, 68];
  weeklyTemperature: number[] = [10, 24, 25, 23, 22, 24, 26];

  // Variables pour les données de température et humidité par période de la journée
  morningHumidity: number[] = [];
  noonHumidity: number[] = [];
  eveningHumidity: number[] = [];

  morningTemperature: number[] = [];
  noonTemperature: number[] = [];
  eveningTemperature: number[] = [];

  dailyTemperatures: { [key: string]: number[] } = {};
  dailyHumidities: { [key: string]: number[] } = {};
  averageTemperatures: number[] = [];
  averageHumidities: number[] = [];
  days: string[] = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ];

  // Nouvelle propriété pour stocker l'instance de chart
  private chart: Chart | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeData();

    // Récupérer les données hebdomadaires et mettre à jour le graphique
    this.getWeeklyData();

    // Actualiser les données périodiquement
    setInterval(() => {
      this.initializeData();
      this.getWeeklyData();
    }, 3600000); // Toutes les heures
  }

  async getWeeklyData() {
    try {
      const response: any = await this.http
        .get('http://localhost:3002/api/data/weekly')
        .toPromise();
      const daysOfWeek = [
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
        'Dimanche',
      ];
      const temperatures: number[] = new Array(7).fill(null);
      const humidities: number[] = new Array(7).fill(null);

      response.forEach((dayData: any) => {
        const dayIndex = daysOfWeek.indexOf(dayData._id);
        if (dayIndex !== -1) {
          temperatures[dayIndex] = dayData.averageTemperature || 0;
          humidities[dayIndex] = dayData.averageHumidity || 0;
        }
      });

      this.weeklyTemperature = temperatures;
      this.weeklyHumidity = humidities;

      // Créer ou mettre à jour le graphique après avoir récupéré les nouvelles données
      this.createChart();
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données hebdomadaires :',
        error
      );
    }
  }

  async initializeData() {
    await this.getHumidity();
    await this.getTemperature();
    await this.getEveningDataForSpecificTime();
    await this.getNoonDataForSpecificTime();
    await this.getMorningDataForSpecificTime();
  }

  createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById(
      'temperatureChart'
    ) as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Température Moyenne (°C)',
            data: this.weeklyTemperature.map((temp) =>
              temp !== null ? temp : 0
            ),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.weeklyTemperature.map((temp) =>
              temp !== null ? 'rgb(255, 99, 132)' : 'transparent'
            ),
            pointBorderColor: this.weeklyTemperature.map((temp) =>
              temp !== null ? 'white' : 'transparent'
            ),
            pointRadius: this.weeklyTemperature.map((temp) =>
              temp !== null ? 8 : 0
            ),
            pointHoverRadius: 10,
            borderWidth: 3,
          },
          {
            label: 'Humidité Moyenne (%)',
            data: this.weeklyHumidity.map((humidity) =>
              humidity !== null ? humidity : 0
            ),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.weeklyHumidity.map((humidity) =>
              humidity !== null ? 'rgb(54, 162, 235)' : 'transparent'
            ),
            pointBorderColor: this.weeklyHumidity.map((humidity) =>
              humidity !== null ? 'white' : 'transparent'
            ),
            pointRadius: this.weeklyHumidity.map((humidity) =>
              humidity !== null ? 8 : 0
            ),
            pointHoverRadius: 10,
            borderWidth: 3,
          },
        ],
      },
      options: {
        // Vos options précédentes restent identiques
      },
    });
  }

  async getHumidity() {
    try {
      const response: any = await this.http
        .get<{ value: string }>('http://localhost:3002/api/data/humidity')
        .toPromise();
      this.humidity = response.value + '%';
      this.updateTemperatureClass();
    } catch (error) {
      console.error("Erreur lors de la récupération de l'humidité", error);
    }
  }

  async getTemperature() {
    try {
      const response: any = await this.http
        .get<{ value: string }>('http://localhost:3002/api/data/temperature')
        .toPromise();
      this.temperature = response.value + '°C';
      this.updateTemperatureClass();
    } catch (error) {
      console.error('Erreur lors de la récupération de la température', error);
    }
  }

  updateTemperatureClass() {
    const tempValue = parseFloat(this.temperature.replace('°C', ''));

    if (tempValue < 15) {
      this.temperatureClass = 'cold-bg';
    } else if (tempValue >= 15 && tempValue < 25) {
      this.temperatureClass = 'moderate-bg';
    } else {
      this.temperatureClass = 'hot-bg';
    }
  }

  async getMorningDataForSpecificTime() {
    try {
      const response: any = await this.http
        .get<{ humidity: string; temperature: string }>(
          'http://localhost:3002/api/data/16h28'
        )
        .toPromise();
      this.humidity_23h05 = response.humidity + '%';
      this.temperature_23h05 = response.temperature + '°C';
      this.morningHumidity.push(
        parseFloat(this.humidity_23h05.replace('%', ''))
      );
      this.morningTemperature.push(
        parseFloat(this.temperature_23h05.replace('°C', ''))
      );
      this.calculateAverages();
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données pour 23h05',
        error
      );
    }
  }

  async getNoonDataForSpecificTime() {
    try {
      const response: any = await this.http
        .get<{ humidity: string; temperature: string }>(
          'http://localhost:3002/api/data/16h29'
        )
        .toPromise();
      this.humidity_23h10 = response.humidity + '%';
      this.temperature_23h10 = response.temperature + '°C';
      this.noonHumidity.push(parseFloat(this.humidity_23h10.replace('%', '')));
      this.noonTemperature.push(
        parseFloat(this.temperature_23h10.replace('°C', ''))
      );
      this.calculateAverages();
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données pour 21h46',
        error
      );
    }
  }

  async getEveningDataForSpecificTime() {
    try {
      const response: any = await this.http
        .get<{ humidity: string; temperature: string }>(
          'http://localhost:3002/api/data/16h30'
        )
        .toPromise();
      this.humidity_23h14 = response.humidity + '%';
      this.temperature_23h14 = response.temperature + '°C';
      this.eveningHumidity.push(
        parseFloat(this.humidity_23h14.replace('%', ''))
      );
      this.eveningTemperature.push(
        parseFloat(this.temperature_23h14.replace('°C', ''))
      );
      this.calculateAverages();
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données pour 23h14',
        error
      );
    }
  }

  calculateAverages() {
    const humidityValues = [
      parseFloat(this.humidity_23h05.replace('%', '')),
      parseFloat(this.humidity_23h10.replace('%', '')),
      parseFloat(this.humidity_23h14.replace('%', '')),
    ];

    const temperatureValues = [
      parseFloat(this.temperature_23h05.replace('°C', '')),
      parseFloat(this.temperature_23h10.replace('°C', '')),
      parseFloat(this.temperature_23h14.replace('°C', '')),
    ];

    const humiditySum = humidityValues.reduce((sum, value) => sum + value, 0);
    const temperatureSum = temperatureValues.reduce(
      (sum, value) => sum + value,
      0
    );

    this.humidity_moy = (humiditySum / humidityValues.length).toFixed(2) + '%';
    this.temperature_moy =
      (temperatureSum / temperatureValues.length).toFixed(2) + '°C';
  }
}
