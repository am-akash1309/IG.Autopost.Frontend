import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    user: any;

    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit(): void {
        if (!this.apiService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.user = this.apiService.getUser();
    }

    onLogout(): void {
        this.apiService.logout();
        this.router.navigate(['/login']);
    }
}
