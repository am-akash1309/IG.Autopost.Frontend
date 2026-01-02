export enum PostStep {
    UPLOADING = 'Uploading',
    AI_VERIFICATION = 'AI Verification',
    MANUAL_REVIEW = 'Manual Review',
    POSTING_TO_INSTAGRAM = 'Posting to Instagram',
    DONE = 'Done',
    FAILED = 'Failed'
}

export interface UploadStatus {
    postId?: string;
    currentStep: PostStep;
    progress: number;
    error?: string;
    failedStep?: PostStep;
    isComplete: boolean;
    stepMessages: { [key in PostStep]?: string };
}
