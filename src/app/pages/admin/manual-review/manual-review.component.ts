import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
    selector: 'app-manual-review',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './manual-review.component.html',
    styleUrls: ['./manual-review.component.css']
})
export class ManualReviewComponent implements OnInit {
    posts: any[] = [];
    loading: boolean = true;

    constructor(
        private apiService: ApiService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.fetchPending();
    }

    fetchPending(): void {
        this.loading = true;
        this.apiService.getPendingReviewPosts().subscribe({
            next: (response) => {
                if (response.success) {
                    this.posts = response.posts.map((p: any) => ({
                        ...p,
                        processing: false,
                        currentMediaIndex: 0
                    }));
                }
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    prevImage(event: Event, post: any): void {
        event.stopPropagation();
        if (post.currentMediaIndex > 0) {
            post.currentMediaIndex--;
        }
    }

    nextImage(event: Event, post: any): void {
        event.stopPropagation();
        if (post.currentMediaIndex < post.file_urls.length - 1) {
            post.currentMediaIndex++;
        }
    }

    decide(post: any, isApproved: boolean): void {
        post.processing = true;
        post.decision = isApproved;

        this.apiService.reviewPost(post._id, isApproved).subscribe({
            next: (response) => {
                if (response.success) {
                    this.toastService.show(
                        isApproved ? 'Post approved and published!' : 'Post rejected',
                        isApproved ? 'success' : 'info'
                    );
                    this.posts = this.posts.filter(p => p._id !== post._id);
                } else {
                    this.toastService.show(response.error || 'Failed to update post', 'error');
                }
                post.processing = false;
            },
            error: (err) => {
                this.toastService.show('An error occurred during verification', 'error');
                post.processing = false;
            }
        });
    }
}
