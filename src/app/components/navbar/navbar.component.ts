import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
    isLoggedIn: boolean = false;
    user: any = null;
    isMenuOpen: boolean = false;

    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit(): void {
        this.apiService.isAuthenticated$.subscribe(status => {
            this.isLoggedIn = status;
            if (status) {
                this.user = this.apiService.getUser();
            } else {
                this.user = null;
            }
        });
    }

    toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
    }

    onLogout(): void {
        this.apiService.logout();
        this.isMenuOpen = false;
        this.router.navigate(['/login']);
    }

    closeMenu(): void {
        this.isMenuOpen = false;
    }
}
