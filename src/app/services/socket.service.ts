import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');  // Connexion à votre serveur Node.js
  }

  // Méthode pour écouter l'événement 'key-pressed'
  listenToKeyPress(callback: (key: string) => void): void {
    this.socket.on('key-pressed', (key: string) => {
      callback(key);
    });
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
