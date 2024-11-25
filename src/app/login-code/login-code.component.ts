import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeypadService } from '../keypad.service';
import { io } from 'socket.io-client';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login-code',
  templateUrl: './login-code.component.html',
  styleUrls: ['./login-code.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class LoginCodeComponent implements OnInit, OnDestroy {
  code: string[] = ['', '', '', '', ''];
  errorMessage = '';
  private socket: any;
  private subscriptions: Subscription[] = [];
  private failedAttempts = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private keypadService: KeypadService
  ) {}

  ngOnInit() {
    this.setupSocketConnection();
    this.subscriptions.push(
      this.keypadService.currentKeypadInput.subscribe((input) => {
        if (input) this.handleKeypadInput(input);
      })
    );
  }

  ngOnDestroy() {
    this.socket?.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupSocketConnection() {
    this.socket = io('http://localhost:3000');
    this.socket.on('keypad-input', (data: string) =>
      this.handleKeypadInput(data)
    );
  }

  handleKeypadInput(data: string) {
    const index = this.code.findIndex((c) => c === '');
    if (index !== -1) {
      this.code[index] = data;
      this.maskInput(index);

      if (this.code.every((c) => c !== '')) {
        this.onLogin();
      }
    }
  }

  onInput(event: Event, index: number) {
    const input = (event.target as HTMLInputElement).value;
    this.code[index] = input;

    if (input && index < this.code.length - 1) {
      this.focusInput(index + 1);
    }

    if (this.code.every((c) => c !== '')) {
      this.onLogin();
    }
  }

  private maskInput(index: number) {
    setTimeout(() => this.updateInputType(index, 'password'), 500);
  }

  private updateInputType(index: number, type: string) {
    const input = document.querySelector(
      `input[name="code${index}"]`
    ) as HTMLInputElement;
    if (input) input.type = type;
  }

  private focusInput(index: number) {
    const input = document.querySelector(
      `input[name="code${index}"]`
    ) as HTMLInputElement;
    input?.focus();
  }

  private resetInputs() {
    this.code.fill('');
    const inputs = document.querySelectorAll<HTMLInputElement>(
      'input[name^="code"]'
    );
    inputs.forEach((input) => {
      input.value = '';
      input.type = 'text';
    });
  }

  private disableInputs() {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      'input[name^="code"]'
    );
    inputs.forEach((input) => (input.disabled = true));
  }

  onLogin() {
    const code = this.code.join('');
    this.authService.loginWithCode(code).subscribe(
      (res) => this.handleLoginSuccess(res),
      (err) => this.handleLoginError()
    );
  }

  private handleLoginSuccess(res: any) {
    if (res.token) {
      localStorage.setItem('token', res.token);
      const role = this.getRoleFromToken(res.token);
      const route = role === 'admin' ? '/dashboard' : '/dashboard-simple';
      this.router.navigate([route]);
    } else {
      this.handleLoginError();
    }
  }

  private handleLoginError() {
    this.errorMessage = 'Erreur lors de la connexion';
    this.failedAttempts++;
    if (this.failedAttempts >= 3) {
      this.disableInputs();
      this.switchToLogin();
    } else {
      this.resetInputs();
    }
  }

  private getRoleFromToken(token: string): string {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  }

  switchToLogin() {
    this.router.navigate(['/login']);
  }
}
