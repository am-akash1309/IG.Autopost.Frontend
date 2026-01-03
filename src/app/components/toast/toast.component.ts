import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="toast-container">
            <div *ngFor="let toast of toastService.toasts$ | async" 
                 class="toast" [ngClass]="toast.type"
                 (click)="toastService.remove(toast.id)">
                <span class="message">{{ toast.message }}</span>
                <i class="material-icons close-icon">close</i>
            </div>
        </div>
    `,
    styles: [`
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }
        .toast {
            pointer-events: auto;
            min-width: 250px;
            padding: 16px 20px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out forwards;
            cursor: pointer;
            backdrop-filter: blur(8px);
        }
        .toast.success {
            background: rgba(16, 185, 129, 0.9);
            border-left: 4px solid #059669;
        }
        .toast.error {
            background: rgba(239, 68, 68, 0.9);
            border-left: 4px solid #dc2626;
        }
        .toast.info {
            background: rgba(59, 130, 246, 0.9);
            border-left: 4px solid #2563eb;
        }
        .message {
            font-weight: 500;
            margin-right: 15px;
        }
        .close-icon {
            font-size: 18px;
            opacity: 0.8;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `]
})
export class ToastComponent {
    toastService = inject(ToastService);
}
