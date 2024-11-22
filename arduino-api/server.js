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

const Historique = mongoose.model('Historique', historiqueSchema);

// Modèle pour stocker les moyennes quotidiennes
const dailyAverageSchema = new mongoose.Schema({
  averageTemperature: Number,
  averageHumidity: Number,
  date: { type: Date, default: Date.now },
  jour: String,
});

const DailyAverage = mongoose.model('DailyAverage', dailyAverageSchema);

function getDayOfWeek() {
  const now = new Date();
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  return days[now.getDay()];
}

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
  '12h10': { temperature: null, humidity: null },
  '12h11': { temperature: null, humidity: null },
  '12h12': { temperature: null, humidity: null },
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

// Fonction pour calculer et enregistrer les moyennes de température et d'humidité
async function calculateAndSaveDailyAverages() {
  try {
    const currentDay = getDayOfWeek();

    // Récupérer toutes les données pour le jour courant
    const dailyData = await Historique.find({ jour: currentDay });

    if (dailyData.length > 0) {
      // Calculer les moyennes de température et d'humidité
      const totalTemperature = dailyData.reduce((acc, data) => acc + data.temperature, 0);
      const totalHumidity = dailyData.reduce((acc, data) => acc + data.humidity, 0);
      const averageTemperature = totalTemperature / dailyData.length;
      const averageHumidity = totalHumidity / dailyData.length;

      // Sauvegarder les moyennes dans la base de données
      const dailyAverage = new DailyAverage({
        averageTemperature,
        averageHumidity,
        jour: currentDay,
      });

      await dailyAverage.save();
      console.log(`Moyenne enregistrée pour ${currentDay}: Température = ${averageTemperature}, Humidité = ${averageHumidity}`);
    }
  } catch (error) {
    console.error('Erreur lors du calcul et de l\'enregistrement des moyennes:', error);
  }
}

// Planification du calcul et de l'enregistrement des moyennes 5 minutes après la dernière heure de collecte (12h05)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 12 && now.getMinutes() === 15) {
    calculateAndSaveDailyAverages();
  }
}, 60000);

app.post('/api/data/save', async (req, res) => {
  const { temperature, humidity, hour } = req.body;
  if (temperature !== null && humidity !== null && hour) {
    await saveDataToDB(hour);
    res.status(200).send(`Données enregistrées à ${hour}`);
  } else {
    res.status(400).send('Données invalides');
  }
});

const specificHoursRoutes = ['12h10', '12h11', '12h12'];

specificHoursRoutes.forEach((hour) => {
  app.get(`/api/data/${hour}`, async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const data = await Historique.find({
        hour,
        date: { $gte: startOfDay, $lte: endOfDay },
      })
        .sort({ date: -1 })
        .limit(1);

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

app.get('/api/data/weekly', async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date();
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const data = await Historique.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: "$jour",
          temperatures: { $push: "$temperature" },
          humidities: { $push: "$humidity" },
          averageTemperature: { $avg: "$temperature" },
          averageHumidity: { $avg: "$humidity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données hebdomadaires :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
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


app.get('/api/data/daily-averages', async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDay();  // Jour de la semaine (0-6, 0=dimanche, 6=samedi)
    const dailyAverage = await DailyAverage.findOne({ jour: getDayOfWeek() }).sort({ date: -1 }).limit(1);

    if (dailyAverage) {
      res.json({
        date: today.toLocaleDateString(),
        averageTemperature: dailyAverage.averageTemperature,
        averageHumidity: dailyAverage.averageHumidity,
      });
    } else {
      res.status(404).json({ message: "Aucune donnée moyenne trouvée pour aujourd'hui." });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des moyennes quotidiennes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
