import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostStep, UploadStatus } from '../../interfaces/post-status.interface';

@Component({
    selector: 'app-status-tracking',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './status-tracking.component.html',
    styleUrls: ['./status-tracking.component.css']
})
export class StatusTrackingComponent {
    @Input() status: UploadStatus | null = null;
    @Input() showDismiss: boolean = true;
    @Output() close = new EventEmitter<void>();

    get displayedSteps() {
        // Base steps
        const baseSteps = [
            { label: PostStep.UPLOADING, icon: 'cloud_upload' },
            { label: PostStep.AI_VERIFICATION, icon: 'psychology' },
            { label: PostStep.POSTING_TO_INSTAGRAM, icon: 'send' },
            { label: PostStep.DONE, icon: 'check_circle' }
        ];

        // Insert Manual Review if it exists in status
        if (this.status?.currentStep === PostStep.MANUAL_REVIEW || this.status?.stepMessages[PostStep.MANUAL_REVIEW]) {
            baseSteps.splice(2, 0, { label: PostStep.MANUAL_REVIEW, icon: 'person_search' });
        }

        return baseSteps;
    }

    isStepActive(stepLabel: string): boolean {
        if (!this.status) return false;

        const stepIdx = this.displayedSteps.findIndex(s => s.label === stepLabel);

        // If the current step is FAILED, we use progress to determine completed steps
        if (this.status.currentStep === PostStep.FAILED) {
            const failedIdx = this.displayedSteps.findIndex(s => s.label === this.status?.failedStep);
            if (failedIdx === -1) {
                // Fallback to progress logic if failedStep is missing
                const progressPerStep = 100 / this.displayedSteps.length;
                return (stepIdx + 1) * progressPerStep < this.status.progress; // Use < instead of <= to exclude the failed step itself
            }
            return stepIdx < failedIdx;
        }

        // If not failed, a step is active if its index is <= the current step's index
        const currentIdx = this.displayedSteps.findIndex(s => s.label === this.status?.currentStep);
        if (currentIdx === -1) return false;

        return stepIdx <= currentIdx;
    }

    isStepFailed(stepLabel: string): boolean {
        return this.status?.currentStep === PostStep.FAILED && this.status?.failedStep === stepLabel;
    }

    isStepCurrent(stepLabel: string): boolean {
        return this.status?.currentStep === stepLabel;
    }

    onClose(event?: Event) {
        if (event) event.stopPropagation();
        this.close.emit();
    }

    onCardClick() {
        // Only flip back if it's an existing post (selectedPostStatus) 
        // OR if it's a completed new upload.
        this.close.emit();
    }
}
