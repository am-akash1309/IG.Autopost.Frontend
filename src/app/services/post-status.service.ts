import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PostStep, UploadStatus } from '../interfaces/post-status.interface';

@Injectable({
    providedIn: 'root'
})
export class PostStatusService {
    private apiService = inject(ApiService);

    private uploadStatusSubject = new BehaviorSubject<UploadStatus | null>(null);
    public uploadStatus$ = this.uploadStatusSubject.asObservable();

    private selectedPostStatusSubject = new BehaviorSubject<UploadStatus | null>(null);
    public selectedPostStatus$ = this.selectedPostStatusSubject.asObservable();

    constructor() { }

    public startUpload(formData: FormData): void {
        const initialStatus: UploadStatus = {
            currentStep: PostStep.UPLOADING,
            progress: 10,
            isComplete: false,
            stepMessages: { [PostStep.UPLOADING]: 'Compressing and uploading media...' }
        };
        this.uploadStatusSubject.next(initialStatus);

        this.apiService.uploadMedia(formData).pipe(
            switchMap(res => {
                if (res && res.success === false) {
                    return throwError(() => new Error(res.error || res.message || 'Upload failed'));
                }

                const nextStatus: UploadStatus = {
                    postId: res.post_id,
                    currentStep: PostStep.AI_VERIFICATION,
                    progress: 30,
                    isComplete: false,
                    stepMessages: {
                        ...this.uploadStatusSubject.value?.stepMessages,
                        [PostStep.UPLOADING]: 'Media uploaded successfully.',
                        [PostStep.AI_VERIFICATION]: 'AI is analyzing your post content...'
                    }
                };
                this.uploadStatusSubject.next(nextStatus);
                return this.apiService.verifyAi(res.post_id);
            }),
            switchMap(res => {
                const currentStatus = this.uploadStatusSubject.value!;

                if (res.status?.needs_manual_review) {
                    // Stop the flow here for AI rejection
                    const manualStatus: UploadStatus = {
                        ...currentStatus,
                        currentStep: PostStep.MANUAL_REVIEW,
                        progress: 50,
                        isComplete: true, // Mark as "complete" so user can dismiss, but post isn't live
                        stepMessages: {
                            ...currentStatus.stepMessages,
                            [PostStep.AI_VERIFICATION]: 'AI split: Content needs human review.',
                            [PostStep.MANUAL_REVIEW]: 'Rejected by AI. Wait for manual verification, will take time.'
                        }
                    };
                    this.uploadStatusSubject.next(manualStatus);
                    return throwError(() => new Error('STALL_FOR_MANUAL')); // Not a real error, just stopping the chain
                }

                const nextStatus: UploadStatus = {
                    ...currentStatus,
                    currentStep: PostStep.POSTING_TO_INSTAGRAM,
                    progress: 70,
                    isComplete: false,
                    stepMessages: {
                        ...currentStatus.stepMessages,
                        [PostStep.AI_VERIFICATION]: 'AI Approved! Preparing for Instagram...',
                        [PostStep.POSTING_TO_INSTAGRAM]: 'Sharing to @coimbatore_pet_adoption...'
                    }
                };
                this.uploadStatusSubject.next(nextStatus);
                return this.apiService.publishPost(currentStatus.postId!);
            }),
            tap(res => {
                const currentStatus = this.uploadStatusSubject.value!;
                const finalStatus: UploadStatus = {
                    ...currentStatus,
                    currentStep: PostStep.DONE,
                    progress: 100,
                    isComplete: true,
                    stepMessages: {
                        ...currentStatus.stepMessages,
                        [PostStep.POSTING_TO_INSTAGRAM]: 'Post is now live on Instagram!',
                        [PostStep.DONE]: 'All set! Thank you for helping.'
                    }
                };
                this.uploadStatusSubject.next(finalStatus);
            }),
            catchError(err => {
                if (err.message === 'STALL_FOR_MANUAL') return throwError(() => err);

                const currentStatus = this.uploadStatusSubject.value;
                const failedStep = currentStatus?.currentStep || PostStep.UPLOADING;

                console.error('PostStatusService: Error during upload', err);
                const errorMessage = err.error?.error || err.error?.message || err.message || 'Something went wrong';
                this.uploadStatusSubject.next({
                    ...currentStatus!,
                    currentStep: PostStep.FAILED,
                    failedStep: failedStep,
                    error: errorMessage,
                    isComplete: true,
                    stepMessages: {
                        ...currentStatus?.stepMessages,
                        [failedStep]: 'Error: ' + errorMessage
                    }
                });
                return throwError(() => err);
            })
        ).subscribe();
    }

    public trackExistingPost(post: any): void {
        let currentStep = PostStep.DONE;
        let progress = 100;
        let stepMessages: { [key in PostStep]?: string } = {};

        if (post.is_published) {
            currentStep = PostStep.DONE;
            progress = 100;
            stepMessages[PostStep.DONE] = 'Successfully published.';
        } else if (post.is_manual_approved === false) {
            currentStep = PostStep.FAILED;
            const failedAt = PostStep.MANUAL_REVIEW;
            progress = 60;
            const errorMsg = 'Post rejected after manual review.';
            stepMessages[failedAt] = errorMsg;
            this.selectedPostStatusSubject.next({
                postId: post._id || post.id,
                currentStep: currentStep as PostStep,
                failedStep: failedAt,
                error: errorMsg,
                progress: progress,
                isComplete: true,
                stepMessages: stepMessages
            });
            return;
        } else if (post.is_manual_approved === true) {
            currentStep = PostStep.POSTING_TO_INSTAGRAM;
            progress = 70;
            stepMessages[PostStep.POSTING_TO_INSTAGRAM] = 'Approved by moderator! Ready to be published.';
        } else if (post.needs_manual_review) {
            currentStep = PostStep.MANUAL_REVIEW;
            progress = 50;
            stepMessages[PostStep.MANUAL_REVIEW] = (post.is_ai_approved === false)
                ? 'Rejected by AI. Wait for manual verification.'
                : 'Waiting for manual approval...';
        } else if (post.is_ai_approved === true) {
            currentStep = PostStep.POSTING_TO_INSTAGRAM;
            progress = 70;
            stepMessages[PostStep.POSTING_TO_INSTAGRAM] = 'Approved! Ready to be published.';
        } else if (post.is_ai_approved === false && !post.needs_manual_review) {
            currentStep = PostStep.FAILED;
            const failedAt = PostStep.AI_VERIFICATION;
            progress = 40;
            const errorMsg = 'Rejected by AI content filters.';
            stepMessages[failedAt] = errorMsg;
            this.selectedPostStatusSubject.next({
                postId: post._id || post.id,
                currentStep: currentStep as PostStep,
                failedStep: failedAt,
                error: errorMsg,
                progress: progress,
                isComplete: true,
                stepMessages: stepMessages
            });
            return;
        } else {
            // Under review (is_ai_approved === null)
            currentStep = PostStep.AI_VERIFICATION;
            progress = 30;
            stepMessages[PostStep.AI_VERIFICATION] = 'Post is under AI analysis.';
        }

        this.selectedPostStatusSubject.next({
            postId: post._id || post.id,
            currentStep: currentStep as PostStep,
            progress: progress,
            isComplete: true,
            stepMessages: stepMessages
        });
    }

    public clearSelectedPost(): void {
        this.selectedPostStatusSubject.next(null);
    }

    public clearUpload(): void {
        this.uploadStatusSubject.next(null);
    }
}
