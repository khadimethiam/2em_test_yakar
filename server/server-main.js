// server-main.js
const SerialPort = require("serialport");
const ReadlineParser = require("@serialport/parser-readline");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const portPath = "COM3"; // Remplacez 'COM3' par le port série de votre Arduino
const port = new SerialPort({ path: portPath, baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
  console.log("Port série ouvert:", portPath);
});

port.on("error", (err) => {
  console.error("Erreur de connexion au port série:", err);
});

parser.on("data", (data) => {
  try {
    const parsedData = JSON.parse(data.trim());
    if (parsedData.type === "sensor") {
      const sensorData = {
        temperature: parsedData.temperature || null,
        humidity: parsedData.humidity || null,
      };
      console.log(
        "Donnée reçue de l'Arduino:",
        sensorData,
        "à",
        getCurrentTime()
      );
      io.emit("sensorData", sensorData);
    } else if (parsedData.type === "keypad") {
      console.log("Données du keypad reçues:", parsedData.key);
      io.emit("keypad-input", parsedData.key);
    }
  } catch (error) {
    console.error("Erreur lors du parsing des données Arduino:", error.message);
  }
});

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
