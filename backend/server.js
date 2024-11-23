const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const invalidatedTokens = new Set();


// Vérification et création du répertoire 'uploads' si nécessaire
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Le répertoire 'uploads' a été créé.");
}

// Configuration de multer pour le téléchargement de fichiers (photo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Pour servir les fichiers téléchargés

// Connexion à MongoDB
mongoose
  .connect("mongodb://localhost:27017/test_yakar", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie"))
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err));

  const UserSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    numero_tel: { type: String, unique: true, required: true },
    mot_de_passe: { type: String, required: true },
    code_authentification: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], required: true },
    status: { type: String, enum: ["actif", "inactif"], default: "actif" }, // Définir "actif" comme valeur par défaut
  photo: { type: String }, // Chemin de la photo
});

const User = mongoose.model("User", UserSchema);

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Vous devez vous connecter d'abord" });
  }

  // Vérifiez si le token est invalidé
  if (invalidatedTokens.has(token)) {
    return res.status(403).json({ message: "Token expiré ou invalidé" });
  }

  try {
    const decoded = jwt.verify(token, "secret_key");
    req.user = decoded; // Ajoute les informations de l'utilisateur à la requête
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
};


// Middleware pour vérifier le rôle d'administrateur
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès interdit, seul un administrateur peut inscrire des utilisateurs" });
  }
  next(); // Si le rôle est admin, on continue l'exécution
};

// Routes
// 1. Inscription (Réservée aux administrateurs)
app.post("/register", authMiddleware, adminMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const { nom, prenom, email, numero_tel, mot_de_passe, role } = req.body;
    const photo = req.file ? req.file.path : null;

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
      photo,
    });

    await newUser.save();
    res.status(201).json({ message: "Utilisateur enregistré avec succès" });
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

// 3. Déconnexion
app.post("/logout", authMiddleware, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    // Ajoutez le token à la liste des tokens invalidés
    invalidatedTokens.add(token);
  }

  res.status(200).json({ message: "Déconnexion réussie" });
});


// 4. Liste des utilisateurs (Accessible uniquement aux administrateurs)
app.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 5. Utilisateur par ID (Accessible uniquement aux administrateurs)
app.get("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Erreur lors de la récupération de l'utilisateur :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 6. Mise à jour utilisateur (Accessible uniquement aux administrateurs)
app.put("/users/:id", authMiddleware, adminMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    if (req.file) {
      updates.photo = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res
      .status(200)
      .json({ message: "Utilisateur mis à jour avec succès", user: updatedUser });
  } catch (err) {
    console.error("Erreur lors de la mise à jour :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 7. Suppression utilisateur (Accessible uniquement aux administrateurs)
app.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression :", err);
    res.status(500).json({ message: "Erreur serveur" });
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

// 8. Changer le rôle d'un utilisateur (Accessible uniquement aux administrateurs)
app.put("/users/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { role } = req.body; // Le rôle à assigner à l'utilisateur

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Rôle mis à jour avec succès", user: updatedUser });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du rôle :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route de mise à jour du statut de l'utilisateur (avec authentification)
app.put("/api/users/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérification si le statut est valide
    if (!['actif', 'inactif'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide. Choisissez entre 'actif' et 'inactif'" });
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Erreur lors de la mise à jour du statut:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
  }
});

// Route pour récupérer tous les utilisateurs (uniquement accessible par les administrateurs)
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find();  // Récupère tous les utilisateurs
    res.status(200).json(users);
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs:", err);
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
  }
});

// Démarrage du serveur
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});
