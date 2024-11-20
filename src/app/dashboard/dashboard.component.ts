import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Chart } from 'chart.js';
import { CommonModule } from '@angular/common'; // Importer CommonModule i


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [SidebarComponent,CommonModule],
})
export class DashboardComponent implements OnInit {
  // Variables pour l'humidité
  humidity: string = '--%';
  humidity_moy: string = '--%';
  humidity_mat: string = '--%';
  humidity_midi: string = '--%';
  humidity_soir: string = '--%';
  humidity_23h10: string = '--%'; // Humidité pour 23h10
  humidity_23h05: string = '--%'; // Humidité pour 23h05
  humidity_23h14: string = '--%'; // Humidité pour 23h14

  // Variables pour la température
  temperature: string = '--°C';
  temperatureClass: string = ''; // Variable pour l'image de température
  temperature_moy: string = '--°C';
  temperature_mat: string = '--°C';
  temperature_midi: string = '--°C';
  temperature_soir: string = '--°C';
  temperature_23h10: string = '--°C'; // Température pour 23h10
  temperature_23h05: string = '--°C'; // Température pour 23h05
  temperature_23h14: string = '--°C'; // Température pour 23h14

  // Tableaux pour stocker les données de la semaine
  weeklyHumidity: number[] = [40, 50, 60, 65, 70, 75, 68];  // Humidité de la semaine
  weeklyTemperature: number[] = [10, 24, 25, 23, 22, 24, 26];  // Température de la semaine

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
  days: string[] = [ 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi','Dimanche'];

 
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    
    // Appels pour récupérer les données au chargement du composant
    this.initializeData();
    setInterval(async () => {
      this.initializeData();
    setInterval(async () => {
    await this.getWeeklyData();
  }, 3600000);
      await this.getHumidity();
      await this.getTemperature();
      this.updateTemperatureClass(); // Mettre à jour l'image après avoir récupéré la température
    }, 120000);
    // Actualisation toutes les 2 minutes

  }


  async getWeeklyData() {
    try {
      const response: any = await this.http.get('http://localhost:3002/api/data/weekly').toPromise();
      // Initialiser les tableaux pour les jours
      const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const temperatures: number[] = new Array(7).fill(null);
      const humidities: number[] = new Array(7).fill(null);
  
      response.forEach((dayData: any) => {
        const dayIndex = daysOfWeek.indexOf(dayData._id);
        if (dayIndex !== -1) {
          temperatures[dayIndex] = dayData.averageTemperature || 0;
          humidities[dayIndex] = dayData.averageHumidity || 0;
        }
      });
  
      // Mettre à jour les données du graphique
      this.weeklyTemperature = temperatures;
      this.weeklyHumidity = humidities;
      this.createChart(); // Re-créer le graphique
    } catch (error) {
      console.error("Erreur lors de la récupération des données hebdomadaires :", error);
    }
  }
  
  
  // Initialisation des données au début
  async initializeData() {
    await this.getHumidity();
    await this.getTemperature();
    await this.getEveningDataForSpecificTime(); // Récupérer les données pour 23h14
    await this.getNoonDataForSpecificTime();    // Récupérer les données pour 23h10
    await this.getMorningDataForSpecificTime(); // Récupérer les données pour 23h05
    this.createChart();
  }

  createChart() {
    const ctx = document.getElementById('temperatureChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'line', // Type de graphique (ligne)
      data: {
        labels: [ 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam','Dim'], // Jours de la semaine
        datasets: [
          {
            label: 'Température Moyenne (°C)', // Légende pour la température
            data: this.weeklyTemperature, // Données de température
            borderColor: 'rgb(255, 99, 132)', // Couleur de la ligne pour la température
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Couleur de fond sous la ligne (transparent)
            fill: true, // Remplir la zone sous la courbe
            tension: 0.4, // Pour arrondir les bords de la courbe
            pointBackgroundColor: 'rgb(255, 99, 132)', // Couleur des points sur la courbe
            pointBorderColor: 'white', // Couleur de la bordure des points
            pointRadius: 8, // Taille des points
            pointHoverRadius: 10, // Taille des points au survol
            pointHoverBackgroundColor: 'rgb(255, 99, 132)', // Couleur de fond des points au survol
            pointBorderWidth: 3, // Largeur de la bordure des points
            borderWidth: 3, // Largeur de la ligne
            // Décalage de l'ombre
             // Décalage de l'ombre
            // Couleur de l'ombre
          },
          {
            label: 'Humidité Moyenne (%)', // Légende pour l'humidité
            data: this.weeklyHumidity, // Données d'humidité
            borderColor: 'rgb(54, 162, 235)', // Couleur de la ligne pour l'humidité
            backgroundColor: 'rgba(54, 162, 235, 0.2)', // Couleur de fond sous la ligne (transparent)
            fill: true, // Remplir la zone sous la courbe
            tension: 0.4, // Pour arrondir les bords de la courbe
            pointBackgroundColor: 'rgb(54, 162, 235)', // Couleur des points sur la courbe
            pointBorderColor: 'white', // Couleur de la bordure des points
            pointRadius: 8, // Taille des points
            pointHoverRadius: 10, // Taille des points au survol
            pointHoverBackgroundColor: 'rgb(54, 162, 235)', // Couleur de fond des points au survol
            pointBorderWidth: 3, // Largeur de la bordure des points
            borderWidth: 3, // Largeur de la ligne
             // Couleur de l'ombre
          },
        ],
      },
      options: {
        responsive: true, // Le graphique s'adapte à la taille de l'écran
        plugins: {
          legend: {
            display: true, // Afficher la légende
            position: 'top', // Position de la légende (haut)
            labels: {
              font: {
                size: 14, // Taille de la police de la légende
                family: 'Arial, sans-serif', // Police de la légende
              },
              color: '#333', // Couleur du texte de la légende
              boxWidth: 20, // Largeur de la case de la légende
              boxHeight: 2, // Hauteur de la case de la légende
            },
          },
          tooltip: {
            enabled: true, // Afficher l'info-bulle au survol des points
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Couleur de fond de l'info-bulle
            titleFont: {
              size: 16, // Taille de la police du titre dans l'info-bulle
              family: 'Arial, sans-serif',
            },
            bodyFont: {
              size: 14, // Taille de la police du corps dans l'info-bulle
              family: 'Arial, sans-serif',
            },
            cornerRadius: 5, // Arrondi des coins de l'info-bulle
            caretSize: 6, // Taille de la flèche de l'info-bulle
          },
        },
        scales: {
          x: {
            title: {
              display: true, // Afficher le titre de l'axe X
              text: 'Jour de la Semaine', // Titre de l'axe X
              font: {
                size: 16, // Taille de la police
                weight: 'bold', // Poids de la police
              },
              color: '#333', // Couleur du titre
            },
            ticks: {
              font: {
                size: 14, // Taille de la police des ticks (étiquettes) de l'axe X
                family: 'Arial, sans-serif',
              },
              color: '#333', // Couleur des ticks
            },
          },
          y: {
            title: {
              display: true, // Afficher le titre de l'axe Y
              text: 'Valeur (°C / %)', // Titre de l'axe Y
              font: {
                size: 16, // Taille de la police
                weight: 'bold',
              },
              color: '#333',
            },
            ticks: {
              font: {
                size: 14, // Taille de la police des ticks de l'axe Y
                family: 'Arial, sans-serif',
              },
              color: '#333', // Couleur des ticks
            },
            beginAtZero: true, // Commencer l'axe Y à zéro
          },
        },
        elements: {
          line: {
            borderWidth: 3, // Largeur de la ligne
          },
          point: {
            radius: 8, // Taille des points de données
          },
        },
        layout: {
          padding: {
            top: 20, // Espacement en haut du graphique
            left: 20, // Espacement à gauche du graphique
            right: 20, // Espacement à droite du graphique
            bottom: 20, // Espacement en bas du graphique
          },
        },
        animation: {
          duration: 1000, // Durée de l'animation (en ms)
          easing: 'easeInOutQuad', // Type d'animation
        },
      },
    });
  }
  
  

  // Méthode pour récupérer l'humidité actuelle
  async getHumidity() {
    try {
      const response: any = await this.http.get<{ value: string }>('http://localhost:3002/api/data/humidity').toPromise();
      this.humidity = response.value + '%';
    } catch (error) {
      console.error("Erreur lors de la récupération de l'humidité", error);
    }
  }

  // Méthode pour récupérer la température actuelle
  async getTemperature() {
    try {
      const response: any = await this.http.get<{ value: string }>('http://localhost:3002/api/data/temperature').toPromise();
      this.temperature = response.value + '°C';
    } catch (error) {
      console.error("Erreur lors de la récupération de la température", error);
    }
  }


  updateTemperatureClass() {
    const tempValue = parseFloat(this.temperature.replace('°C', ''));

    if (tempValue < 15) {
      this.temperatureClass = 'cold-bg'; // Froid
    } else if (tempValue >= 15 && tempValue < 25) {
      this.temperatureClass = 'moderate-bg'; // Modéré
    } else {
      this.temperatureClass = 'hot-bg'; // Chaud
    }
  }


  async getMorningDataForSpecificTime() {
    try {
      const response: any = await this.http
        .get<{ humidity: string; temperature: string }>('http://localhost:3002/api/data/17h16')
        .toPromise();
      this.humidity_23h05 = response.humidity + '%';
      this.temperature_23h05 = response.temperature + '°C';
      // Ajouter les données dans les tableaux correspondants
      this.morningHumidity.push(parseFloat(this.humidity_23h05.replace('%', '')));
      this.morningTemperature.push(parseFloat(this.temperature_23h05.replace('°C', '')));
      this.calculateAverages(); // Calculer les moyennes après chaque récupération de données
    } catch (error) {
      console.error("Erreur lors de la récupération des données pour 23h05", error);
    }
  }

  // Méthode pour récupérer les données spécifiques pour 23h10
  async getNoonDataForSpecificTime() {
    try {
      const response: any = await this.http
        .get<{ humidity: string; temperature: string }>('http://localhost:3002/api/data/17h17')
        .toPromise();
      this.humidity_23h10 = response.humidity + '%';
      this.temperature_23h10 = response.temperature + '°C';
      // Ajouter les données dans les tableaux correspondants
      this.noonHumidity.push(parseFloat(this.humidity_23h10.replace('%', '')));
      this.noonTemperature.push(parseFloat(this.temperature_23h10.replace('°C', '')));
      this.calculateAverages(); // Calculer les moyennes après chaque récupération de données
    } catch (error) {
      console.error("Erreur lors de la récupération des données pour 21h46", error);
    }
  }

  // Méthode pour récupérer les données spécifiques pour 23h14
  async getEveningDataForSpecificTime() {
    try {
      const response: any = await this.http
        .get<{ humidity: string; temperature: string }>('http://localhost:3002/api/data/17h18')
        .toPromise();
      this.humidity_23h14 = response.humidity + '%';
      this.temperature_23h14 = response.temperature + '°C';
      // Ajouter les données dans les tableaux correspondants
      this.eveningHumidity.push(parseFloat(this.humidity_23h14.replace('%', '')));
      this.eveningTemperature.push(parseFloat(this.temperature_23h14.replace('°C', '')));
      this.calculateAverages(); // Calculer les moyennes après chaque récupération de données
    } catch (error) {
      console.error("Erreur lors de la récupération des données pour 23h14", error);
    }
  }

// Méthode pour calculer les moyennes de température et d'humidité
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
  const temperatureSum = temperatureValues.reduce((sum, value) => sum + value, 0);

  this.humidity_moy = (humiditySum / humidityValues.length).toFixed(2) + '%';
  this.temperature_moy = (temperatureSum / temperatureValues.length).toFixed(2) + '°C';
}
}