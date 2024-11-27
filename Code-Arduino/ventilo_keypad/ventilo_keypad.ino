#include <Keypad.h>

const byte ROWS = 4; // Quatre lignes
const byte COLS = 4; // Quatre colonnes

// Définir le keymap
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

// Connecter les lignes du keypad aux broches de l'Arduino
byte rowPins[ROWS] = {9, 8, 7, 6};
// Connecter les colonnes du keypad aux broches de l'Arduino
byte colPins[COLS] = {5, 4, 3, 2};

// Créer une instance de la classe Keypad
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

const int fanPin = 10; // Broche à laquelle le ventilateur est connecté

void setup() {
  Serial.begin(9600); // Initialiser la communication série à 9600 bauds
  pinMode(fanPin, OUTPUT); // Configurer la broche du ventilateur comme sortie
  digitalWrite(fanPin, LOW); // Assurer que le ventilateur est éteint au démarrage
}

void loop() {
  char key = keypad.getKey();

  if (key) {
    Serial.println(key); // Envoyer la touche pressée via le port série
  }

  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n'); // Lire la commande série
    command.trim(); // Supprimer les espaces blancs

    if (command == "VENTILATEUR_ON") {
      digitalWrite(fanPin, HIGH); // Allumer le ventilateur
      Serial.println("Ventilateur allumé");
    } else if (command == "VENTILATEUR_OFF") {
      digitalWrite(fanPin, LOW); // Éteindre le ventilateur
      Serial.println("Ventilateur éteint");
    } else {
      Serial.println("Commande inconnue");
    }
  }
}
