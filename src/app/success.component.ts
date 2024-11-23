// success-dialog.component.ts
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-success-dialog',
  template: `
    <div class="dialog-content">
  <div class="icon">
    <i class="material-icons" style="font-size: 50px; color: green;">check_circle</i>
  </div>
  <h2 class="mt-3">Succès</h2>
  <p>L'utilisateur a été modifié avec succès</p>
  <button mat-button mat-raised-button color="primary" (click)="closeDialog()">OK</button>
</div>

  `,
  styles: [`
    .dialog-content {
      text-align: center;
      padding: 20px;
    }
    .icon {
      font-size: 48px;
      color: green;
    }
    button {
      margin-top: 20px;
    }
  `]
})
export class SuccessDialogComponent {
    constructor(private dialogRef: MatDialogRef<SuccessDialogComponent>) {}

    closeDialog() {
      this.dialogRef.close(); // Ferme le dialog
    }
}
