const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const { SerialPort, ReadlineParser } = require("serialport");
const { Request, Response } = require('express');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Configuration CORS pour permettre les connexions depuis n'importe où
const corsOptions = {
  origin: "http://localhost:4200", // URL de votre frontend Angular
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));

// Middleware pour parser les données JSON
app.use(bodyParser.json());

// Middleware pour servir les fichiers d'images téléchargées depuis le dossier "uploads"
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connexion à MongoDB
mongoose
  .connect("mongodb://localhost:27017/Projet_Angular", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

// Configuration de Multer pour gérer les fichiers téléchargés (photos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../public/images/profil"); // Dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nom unique du fichier
  },
});

const upload = multer({ storage });

// Modèle Utilisateur avec statut et photo
const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  numero_tel: { type: String, unique: true, required: true },
  mot_de_passe: { type: String, required: true },
  code_authentification: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], required: true },
  status: { type: String, enum: ["actif", "inactif"], default: "actif" }, // Définir "actif" comme valeur par défaut
  photo: { type: String }, // Chemin vers l'image téléchargée
});

const User = mongoose.model("User", UserSchema);

// Middleware d'authentification (Vérification JWT)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Accès interdit, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, "secret_key");
    req.userId = decoded.userId;
    req.role = decoded.role;

    // Vérifier si l'utilisateur a le rôle 'admin'
    if (req.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Accès interdit, administrateur uniquement" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// Route de mise à jour du rôle de l'utilisateur (avec authentification)
app.put("/api/users/:id/role", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Vérification du rôle avant mise à jour
    if (!["admin", "user"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Rôle invalide. Choisissez entre 'admin' et 'user'" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Erreur lors de la mise à jour du rôle:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du rôle" });
  }
});

// Route d'inscription avec photo
app.post("/register", upload.single("photo"), async (req, res) => {
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

    const photo = req.file ? req.file.path : null;

    const newUser = new User({
      nom,
      prenom,
      email,
      numero_tel,
      mot_de_passe: hashedPassword,
      code_authentification,
      role,
      photo,
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

    if (user.status === "inactif") {
      return res
        .status(403)
        .json({
          message:
            "Votre compte est inactif. Veuillez contacter l'administrateur.",
        });
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

    if (user.status === "inactif") {
      return res
        .status(403)
        .json({
          message:
            "Votre compte est inactif. Veuillez contacter l'administrateur.",
        });
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

// Route pour vérifier si un utilisateur existe
app.get("/check-user-exists", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email });

    if (user) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error("Erreur lors de la vérification de l'utilisateur:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la vérification de l'utilisateur" });
  }
});

// Route de mise à jour du statut de l'utilisateur (avec authentification)
app.put("/api/users/:id/status", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérification si le statut est valide
    if (!["actif", "inactif"].includes(status)) {
      return res.status(400).json({
        message: "Statut invalide. Choisissez entre 'actif' et 'inactif'",
      });
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Erreur lors de la mise à jour du statut:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour du statut" });
  }
});

// Route pour récupérer tous les utilisateurs (uniquement accessible par les administrateurs)
app.get("/api/users", authenticate, async (req, res) => {
  try {
    const users = await User.find(); // Récupère tous les utilisateurs
    res.status(200).json(users);
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des utilisateurs" });
  }
});

// Configuration du port série pour lire les données du keypad
/*const portPath = "COM4"; // Remplacez 'COM4' par le port série de votre Arduino
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
});*/

// Démarrage du serveur
server.listen(3000, () => {
  console.log("Serveur démarré sur le port 3000");
});


// Route pour mettre à jour les informations de l'utilisateur (y compris la photo)
app.put("/users/:id", authenticate, upload.single("photo"), async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    // Ajout de la gestion du fichier photo
    if (req.file) {
      updates.photo = req.file.path;  // Assurez-vous que le chemin est correct
    }

    // Mise à jour de l'utilisateur dans la base de données
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).send("Utilisateur non trouvé");
    }

    res.status(200).json({ message: "Mise à jour réussie", user: updatedUser });
  } catch (err) {
    console.error("Erreur lors de la mise à jour :", err);
    res.status(500).send("Erreur serveur");
  }
});


app.post("/users/verify-password", authenticate, async (req, res) => {
  try {
    const { userId, oldPassword } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérification du mot de passe actuel
    const isMatch = await bcrypt.compare(oldPassword, user.mot_de_passe);
    if (!isMatch) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect" });
    }

    res.status(200).json({ message: "Ancien mot de passe valide" });
  } catch (err) {
    console.error("Erreur lors de la vérification du mot de passe:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




// 3. Déconnexion
app.post("/logout", authenticate, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    // Ajoutez le token à la liste des tokens invalidés
    invalidatedTokens.add(token);
  }

  res.status(200).json({ message: "Déconnexion réussie" });
});
