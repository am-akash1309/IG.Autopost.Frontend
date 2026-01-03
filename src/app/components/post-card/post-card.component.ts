import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-post-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './post-card.component.html',
    styleUrls: ['./post-card.component.css']
})
export class PostCardComponent {
    @Input() post: any;

    getStatusClass(post: any): string {
        if (post.is_published) return 'status-published';
        if (post.is_manual_approved === true) return 'status-approved';
        if (post.is_manual_approved === false || (post.is_ai_approved === false && !post.needs_manual_review)) return 'status-rejected';
        if (post.needs_manual_review) return 'status-review';
        if (post.is_ai_approved) return 'status-approved';
        return 'status-pending';
    }

    getStatusLabel(post: any): string {
        if (post.is_published) return 'Published';
        if (post.is_manual_approved === true) return 'Approved';
        if (post.is_manual_approved === false || (post.is_ai_approved === false && !post.needs_manual_review)) return 'Rejected';
        if (post.needs_manual_review) return 'Needs Review';
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
