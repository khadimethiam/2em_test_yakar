#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define LED_VERTE 7
#define LED_ROUGE 9
#define BUZZER 8

DHT dht(DHTPIN, DHTTYPE);

float temperature_seuil = 27.0; // Seuil de température pour activer/désactiver le buzzer
unsigned long lastSensorRead = 0;
const long sensorInterval = 2000;

void setup() {
  Serial.begin(9600); // Initialisation de la communication série
  pinMode(LED_VERTE, OUTPUT);
  pinMode(LED_ROUGE, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  dht.begin();
  Serial.println("Carte prête...");
}

void loop() {
  // Lecture des capteurs tous les 2 secondes
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= sensorInterval) {
    lastSensorRead = currentMillis;

    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
      handleSensorError(); // Si une erreur de lecture se produit
      return;
    }

    sendSerialData(temperature, humidity);

    // Contrôle des LEDs et du buzzer en fonction de la température
    if (temperature > temperature_seuil) {
      digitalWrite(LED_ROUGE, HIGH); // LED rouge allumée
      digitalWrite(LED_VERTE, LOW);  // LED verte éteinte
      tone(BUZZER, 200, 100); // Activation du buzzer
    } else {
      digitalWrite(LED_ROUGE, LOW);  // LED rouge éteinte
      digitalWrite(LED_VERTE, HIGH); // LED verte allumée
      noTone(BUZZER); // Désactivation du buzzer
    }
  }
}

// Gestion des erreurs de capteur
void handleSensorError() {
  Serial.println("Erreur: Impossible de lire les données du capteur DHT11.");
  digitalWrite(LED_ROUGE, HIGH);  // LED rouge pour indiquer une erreur
  digitalWrite(LED_VERTE, LOW);   // LED verte éteinte
  tone(BUZZER, 50); // Alerte sonore d'erreur
  delay(1000);
  noTone(BUZZER); // Arrêt du son
}

// Envoi des données de température et d'humidité sur le port série
void sendSerialData(float temperature, float humidity) {
  Serial.print("{\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"humidity\":");
  Serial.print(humidity, 1);
  Serial.println("}");
}
