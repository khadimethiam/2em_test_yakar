import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-login-code',
  templateUrl: './login-code.component.html',
  styleUrls: ['./login-code.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class LoginCodeComponent implements OnInit {
  code = ['', '', '', '', ''];
  errorMessage = '';
  socket: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.socket = io('http://localhost:3000');
    this.socket.on('keypad-input', (data: string) => {
      this.handleKeypadInput(data);
    });
  }

  handleKeypadInput(data: string) {
    const index = this.code.findIndex((c) => c === '');
    if (index !== -1) {
      this.code[index] = data;
      if (this.code.every((c) => c !== '')) {
        this.onLogin();
      }
    }
  }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length === 1 && index < this.code.length - 1) {
      const nextInput = document.querySelector(
        `input[name="code${index + 1}"]`
      ) as HTMLInputElement;
      nextInput.focus();
    }

    this.code[index] = value;

    // Vérifier si tous les champs sont remplis
    if (this.code.every((c) => c !== '')) {
      this.onLogin();
    }
  }

  onLogin() {
    const code = this.code.join('');
    this.authService.loginWithCode(code).subscribe(
      (res) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          const role = this.getRoleFromToken(res.token);
          if (role === 'admin') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/dashboard-user']);
          }
        } else {
          this.errorMessage = 'Erreur lors de la connexion';
          this.resetCode();
        }
      },
      (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors de la connexion';
        this.resetCode();
      }
    );
  }

  getRoleFromToken(token: string): string {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  }

  switchToLogin() {
    this.router.navigate(['/login']);
  }

  resetCode() {
    this.code = ['', '', '', '', ''];
    const inputs = document.querySelectorAll(
      'input[name^="code"]'
    ) as NodeListOf<HTMLInputElement>;
    inputs.forEach((input) => {
      input.value = '';
    });
  }
}
