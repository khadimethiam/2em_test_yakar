import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentMode: 'light' | 'dark' = 'light';

  getMode(): 'light' | 'dark' {
    return this.currentMode;
  }

  setMode(mode: 'light' | 'dark'): void {
    this.currentMode = mode;
  }

  toggleMode(): void {
    this.currentMode = this.currentMode === 'light' ? 'dark' : 'light';
  }
}
