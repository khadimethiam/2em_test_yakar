import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class KeypadService {
  private keypadInputSource = new BehaviorSubject<string>('');
  currentKeypadInput = this.keypadInputSource.asObservable();

  updateKeypadInput(input: string) {
    this.keypadInputSource.next(input);
  }
}
