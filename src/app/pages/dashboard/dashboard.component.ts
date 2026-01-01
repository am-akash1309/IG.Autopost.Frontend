import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    user: any;
    posts: any[] = [];
    isLoading = true;

    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit(): void {
        if (!this.apiService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.user = this.apiService.getUser();
        this.fetchPosts();
    }

    fetchPosts(): void {
        this.isLoading = true;
        this.apiService.getUserPosts().subscribe({
            next: (response) => {
                this.posts = response.posts || [];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error fetching posts:', error);
                this.isLoading = false;
            }
        });
    }

    onLogout(): void {
        this.apiService.logout();
        this.router.navigate(['/login']);
    }

    getStatusClass(post: any): string {
        if (post.is_published) return 'status-published';
        if (post.needs_manual_review) return 'status-review';
        if (post.is_ai_approved) return 'status-approved';
        return 'status-pending';
    }

    getStatusLabel(post: any): string {
        if (post.is_published) return 'Published';
        if (post.needs_manual_review) return 'Needs Manual Review';
        if (post.is_ai_approved) return 'AI Approved';
        return 'Under Review';
    }

    isImage(url: string): boolean {
        if (!url) return false;
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const extension = url.split('.').pop()?.toLowerCase() || '';
        return imageExtensions.includes(extension) || url.startsWith('data:image');
    }
}
