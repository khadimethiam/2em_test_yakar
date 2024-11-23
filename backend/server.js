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
  numero_tel: { type: String, unique: true, required: true, match: /^(70|75|76|77|78)\d{7}$/ },
  mot_de_passe: { type: String, minlength: 8 },
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

// Route de modification d'un utilisateur
app.put("/update/:id", async (req, res) => {
    const { nom, prenom, email, telephone, motDePasse, role } = req.body;
    const { id } = req.params; // Récupère l'id de l'utilisateur depuis les paramètres de la requête
  
    try {
      // Vérifie si l'utilisateur existe
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Vérifie si l'email est déjà utilisé par un autre utilisateur
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre utilisateur.' });
      }
  
      // Mise à jour des données de l'utilisateur
      user.nom = nom || user.nom;
      user.prenom = prenom || user.prenom;
      user.email = email || user.email;
      user.role = role || user.role;
      user.numero_tel = telephone || user.numero_tel;
  
      // Mise à jour et hachage du mot de passe si un nouveau mot de passe est fourni
      if (motDePasse) {
        user.mot_de_passe = await bcrypt.hash(motDePasse, 10);
      }
  
      // Enregistrer les changements
      const updatedUser = await user.save();
  
      // Répondre avec les données mises à jour
      res.status(200).json({
        _id: updatedUser.id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        email: updatedUser.email,
        role: updatedUser.role,
        telephone: updatedUser.numero_tel,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  
});

// Obtenir un utilisateur par ID
app.get("/:id",  async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
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


// Obtenir un utilisateur par ID
app.get("/user/edit/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fonction pour hacher un mot de passe
const hashPassword = async (plainPassword) => {
  try {
    const saltRounds = 10; // Nombre de rounds pour générer le sel
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Erreur lors du hachage du mot de passe :", error);
    throw error;
  }
};

// Exemple d'utilisation dans une route Express


app.post('/hash-password', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    res.status(200).json({ hashedPassword });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du hachage du mot de passe' });
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
