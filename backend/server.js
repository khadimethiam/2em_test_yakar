const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { SerialPort, ReadlineParser } = require("serialport");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.use(bodyParser.json());
app.use(cors());

// Connexion à MongoDB
mongoose
  .connect("mongodb://localhost:27017/test_yakar", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// Modèle Utilisateur
const UserSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  email: { type: String, unique: true, required: true },
  numero_tel: { type: String, unique: true, required: true },
  mot_de_passe: String,
  code_authentification: String,
  role: { type: String, enum: ["admin", "user"], required: true },
});

const User = mongoose.model("User", UserSchema);

// Route d'inscription
app.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, numero_tel, mot_de_passe, role } = req.body;

    // Vérifier si l'email ou le numéro de téléphone existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { numero_tel }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "L'utilisateur existe déjà" });
    }

    const code_authentification = Math.floor(
      10000 + Math.random() * 90000
    ).toString();
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const newUser = new User({
      nom,
      prenom,
      email,
      numero_tel,
      mot_de_passe: hashedPassword,
      code_authentification,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: "Utilisateur enregistré" });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
});

// Route de connexion
app.post("/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secret_key",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token });
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
});

// Route d'authentification avec le code généré
app.post("/login-code", async (req, res) => {
  try {
    const { code_authentification } = req.body;
    const user = await User.findOne({ code_authentification });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Code d'authentification incorrect" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "secret_key",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token });
  } catch (err) {
    console.error("Erreur lors de l'authentification avec le code:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de l'authentification avec le code" });
  }
});

// Configuration du port série pour lire les données du keypad
const portPath = "COM4"; // Remplacez 'COM4' par le port série de votre Arduino
if (!portPath) {
  console.error("Le chemin du port série n'est pas défini");
  process.exit(1);
}

const port = new SerialPort({ path: portPath, baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
  console.log("Port série ouvert:", portPath);
});

port.on("error", (err) => {
  console.error("Erreur de connexion au port série:", err);
});

parser.on("data", (data) => {
  console.log("Données du keypad reçues:", data);
  // Envoyer les données du keypad à tous les clients connectés
  io.emit("keypad-input", data);
});

// Démarrage du serveur
server.listen(3000, () => {
  console.log("Serveur démarré sur le port 3000");
});
