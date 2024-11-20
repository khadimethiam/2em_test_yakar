const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const port = 3002; // Port de l'API

app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/tonBaseDeDonnees', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connecté à MongoDB');
}).catch((err) => {
  console.log('Erreur de connexion à MongoDB:', err);
});

// Modèle pour stocker les données historiques
const historiqueSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  hour: String,
  date: { type: Date, default: Date.now },
  jour: String,
});

function getDayOfWeek() {
  const now = new Date();
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return days[now.getDay()];
}

const Historique = mongoose.model('Historique', historiqueSchema);

const arduinoPort = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 9600,
});

const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));

let sensorData = { temperature: null, humidity: null };

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

parser.on('data', (data) => {
  try {
    const parsedData = JSON.parse(data.trim());
    sensorData = {
      temperature: parsedData.temperature || null,
      humidity: parsedData.humidity || null,
    };
    console.log('Donnée reçue de l\'Arduino:', sensorData, 'à', getCurrentTime());
  } catch (error) {
    console.error('Erreur lors du parsing des données Arduino:', error.message);
  }
});

async function saveDataToDB(hour) {
  const currentDay = getDayOfWeek();
  const dataToSave = {
    temperature: sensorData.temperature,
    humidity: sensorData.humidity,
    hour: hour,
    jour: currentDay,
  };

  const newHistorique = new Historique(dataToSave);
  try {
    await newHistorique.save();
    console.log(`Données enregistrées avec succès à ${hour} (${currentDay})`);
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement des données à ${hour} :`, error);
  }
}

// Heures spécifiques à surveiller
let dataForSpecificHours = {
  '17h16': { temperature: null, humidity: null },
  '17h17': { temperature: null, humidity: null },
  '17h18': { temperature: null, humidity: null },
};

function checkAndSaveData() {
  const now = new Date();
  const timeKey = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  if (dataForSpecificHours[timeKey] && dataForSpecificHours[timeKey].temperature === null) {
    axios.post('http://localhost:3002/api/data/save', {
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      hour: timeKey,
    })
    .then(() => {
      console.log(`Données envoyées et enregistrées avec succès à ${timeKey}`);
    })
    .catch((error) => {
      console.error(`Erreur lors de l'envoi des données à ${timeKey}:`, error);
    });

    dataForSpecificHours[timeKey] = { ...sensorData };
  }
}

setInterval(checkAndSaveData, 60000);

app.post('/api/data/save', async (req, res) => {
  const { temperature, humidity, hour } = req.body;
  if (temperature !== null && humidity !== null && hour) {
    await saveDataToDB(hour);
    res.status(200).send(`Données enregistrées à ${hour}`);
  } else {
    res.status(400).send('Données invalides');
  }
});

const specificHoursRoutes = ['17h16', '17h17', '17h18'];

specificHoursRoutes.forEach((hour) => {
  app.get(`/api/data/${hour}`, async (req, res) => {
    try {
      // Obtenir la date actuelle
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Début du jour actuel
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Fin du jour actuel

      // Rechercher des données pour l'heure spécifiée et la date actuelle
      const data = await Historique.find({
        hour,
        date: { $gte: startOfDay, $lte: endOfDay }, // Filtrer entre début et fin du jour
      })
        .sort({ date: -1 }) // Trier par date décroissante
        .limit(1); // Limiter à une donnée

      if (data.length > 0) {
        res.json({
          temperature: data[0].temperature,
          humidity: data[0].humidity,
          hour: data[0].hour,
          date: data[0].date,
        });
      } else {
        res.status(404).json({ message: `Aucune donnée trouvée pour l'heure ${hour} aujourd'hui.` });
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des données pour ${hour}:`, error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });
});


// Routes pour obtenir les données de température et d'humidité
app.get('/api/data/humidity', (req, res) => {
  if (sensorData.humidity !== null) {
    res.json({ value: sensorData.humidity, time: getCurrentTime() });
  } else {
    res.status(404).json({ error: "Aucune donnée d'humidité disponible." });
  }
});

app.get('/api/data/temperature', (req, res) => {
  if (sensorData.temperature !== null) {
    res.json({ value: sensorData.temperature, time: getCurrentTime() });
  } else {
    res.status(404).json({ error: "Aucune donnée de température disponible." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



app.get('/api/data/weekly', async (req, res) => {
  try {
    // Déterminer le début et la fin de la semaine actuelle
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Dimanche
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date();
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi
    endOfWeek.setHours(23, 59, 59, 999);

    // Récupérer les données hebdomadaires
    const data = await Historique.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: "$jour", // Grouper par jour
          temperatures: { $push: "$temperature" },
          humidities: { $push: "$humidity" },
          averageTemperature: { $avg: "$temperature" },
          averageHumidity: { $avg: "$humidity" },
        },
      },
      { $sort: { _id: 1 } }, // Trier par ordre des jours
    ]);

    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données hebdomadaires :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


