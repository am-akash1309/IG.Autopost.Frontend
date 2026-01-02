import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PostCardComponent } from '../../components/post-card/post-card.component';
import { PostStatusService } from '../../services/post-status.service';
import { UploadStatus } from '../../interfaces/post-status.interface';
import { StatusTrackingComponent } from '../../components/status-tracking/status-tracking.component';


@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, PostCardComponent, StatusTrackingComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    private postStatusService = inject(PostStatusService);
    user: any;

    posts: any[] = [];
    isLoading = true;
    uploadStatus: UploadStatus | null = null;
    selectedPostStatus: UploadStatus | null = null;

    constructor(
        private apiService: ApiService,
        private router: Router
    ) { }



    ngOnInit(): void {
        if (!this.apiService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.user = this.apiService.getUser();
        this.fetchPosts();

        this.postStatusService.uploadStatus$.subscribe(status => {
            this.uploadStatus = status;
        });

        this.postStatusService.selectedPostStatus$.subscribe(status => {
            this.selectedPostStatus = status;
        });
    }


    fetchPosts(silent: boolean = false): void {
        if (!silent) this.isLoading = true;
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

    onPostClick(post: any) {
        this.postStatusService.trackExistingPost(post);
    }

    clearSelectedStatus() {
        this.postStatusService.clearSelectedPost();
        this.fetchPosts(true); // Silent refresh to catch any background updates
    }

    clearUploadStatus() {
        this.postStatusService.clearUpload();
        this.fetchPosts(true); // Silent refresh to show the new post card
    }
}

