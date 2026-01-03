import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    toasts$ = this.toastsSubject.asObservable();
    private nextId = 0;

    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
        const toast: Toast = {
            message,
            type,
            id: this.nextId++
        };
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, toast]);

        setTimeout(() => {
            this.remove(toast.id);
        }, 5000);
    }

    success(message: string) {
        this.show(message, 'success');
    }

    error(message: string) {
        this.show(message, 'error');
    }

    info(message: string) {
        this.show(message, 'info');
    }

    remove(id: number) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
    }
}
