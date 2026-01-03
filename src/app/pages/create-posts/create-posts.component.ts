import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HostListener } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { PostStatusService } from '../../services/post-status.service';


@Component({
    selector: 'app-create-posts',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './create-posts.component.html',
    styleUrls: ['./create-posts.component.css']
})
export class CreatePostsComponent {
    private postStatusService = inject(PostStatusService);
    postForm: FormGroup;

    selectedFiles: File[] = [];
    originalFiles: File[] = [];
    previewUrls: string[] = [];
    selectedAspectRatio: number = 1;
    isUploading = false;
    isProcessing = false;
    showModal = false;
    uploadResponse: any = null;
    currentPreviewIndex = 0;
    dynamicHashtags = '';
    generatedFullCaption = '';
    activeDropdown: string | null = null;

    districts = [
        'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
        'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
        'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
        'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
        'Ramanathapuram', 'Ranipet', 'Salem', 'Sivagangai', 'Tenkasi',
        'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
        'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
        'Vellore', 'Viluppuram', 'Virudhunagar'
    ];

    currentUser: any;

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private router: Router
    ) {
        this.currentUser = this.apiService.getUser();
        this.postForm = this.fb.group({
            category: ['dog', Validators.required],
            action: ['adoption', Validators.required],
            phone: ['', [Validators.pattern('^[0-9]{10}$')]],
            useInstagram: [false],
            locationDetail: ['', Validators.required],
            city: ['Coimbatore', Validators.required],
            userCaption: [''],
            type: ['post', Validators.required]
        }, { validators: this.contactValidator });

        // Update hashtags whenever form changes
        this.postForm.valueChanges.subscribe(() => {
            this.generateHashtags();
        });

        // Initialize hashtags
        this.generateHashtags();
    }

    contactValidator(group: FormGroup) {
        const phone = group.get('phone')?.value;
        const useInstagram = group.get('useInstagram')?.value;
        return (phone && phone.length === 10) || useInstagram ? null : { contactRequired: true };
    }

    generateHashtags() {
        const values = this.postForm.value;
        const city = values.city.toLowerCase().replace(/\s+/g, '');
        const category = values.category; // cat or dog
        const action = values.action; // adoption or missing

        let hashtags = '';
        if (action === 'adoption') {
            hashtags = `#${city} #cbe\n#pet #pets\n#petsforadoption #petforadoption\n#petsforadoptionin${city}\n`;
            if (category === 'cat') {
                hashtags += `#kitty #kitten #kittens #cat #cats\n#kittenforadoption #kittensforadoption\n#kittensforadoptionin${city}\n#catforadoption #catsforadoption\n#catsforadoptionin${city}`;
            } else {
                hashtags += `#puppy #puppies #dog #dogs\n#puppiesforadoption #puppyforadoption\n#puppiesforadoptionin${city}\n#dogsforadoption\n#dogsforadoptionin${city}`;
            }
        } else {
            // Missing pet logic - no "for"
            hashtags = `#${city} #cbe\n#pet #pets\n#petsmissing #petmissing\n#petsmissingin${city}\n`;
            if (category === 'cat') {
                hashtags += `#kitty #kitten #kittens #cat #cats\n#missingcat #missingkitten\n#missingkittensin${city}\n#catmissing #kittenmissing\n#catmissingin${city}`;
            } else {
                hashtags += `#puppy #puppies #dog #dogs\n#missingdog #missingpuppy\n#missingpuppiesin${city}\n#dogmissing\n#dogmissingin${city}`;
            }
        }

        this.dynamicHashtags = hashtags;
    }

    async onFileSelected(event: any) {
        const files = event.target.files;
        if (files) {
            const remainingSlots = 6 - this.originalFiles.length;
            if (remainingSlots <= 0) {
                alert('Maximum 6 images allowed.');
                return;
            }

            const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

            // Filter for images only
            const validFiles = filesToProcess.filter(file => {
                if (!file.type.startsWith('image/')) {
                    alert(`${file.name} is not an image.`);
                    return false;
                }
                return true;
            });

            this.originalFiles = [...this.originalFiles, ...validFiles];
            await this.processImages();
        }
    }

    private loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async processImages() {
        if (this.originalFiles.length === 0) {
            this.selectedFiles = [];
            this.previewUrls = [];
            return;
        }

        this.isProcessing = true;
        try {
            const imageElements = await Promise.all(this.originalFiles.map(file => this.loadImage(file)));
            const imageRatios = imageElements.map(img => img.width / img.height);

            // Instagram supported ratios: 1.91:1, 4:5 (0.8), 1:1
            const targets = [1.91, 0.8, 1.0];

            // For each image, find the closest target ratio
            const closestTargets = imageRatios.map(r => {
                return targets.reduce((prev, curr) => Math.abs(curr - r) < Math.abs(prev - r) ? curr : prev);
            });

            // If multiple images, pick the majority ratio
            let bestRatio: number;
            if (closestTargets.length === 1) {
                bestRatio = closestTargets[0];
            } else {
                const counts: any = {};
                closestTargets.forEach(t => counts[t] = (counts[t] || 0) + 1);
                bestRatio = parseFloat(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
            }

            this.selectedAspectRatio = bestRatio;

            const processedFiles: File[] = [];
            const processedUrls: string[] = [];

            for (let i = 0; i < imageElements.length; i++) {
                const img = imageElements[i];
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // Use 1080p as base for high quality
                let targetWidth, targetHeight;
                if (bestRatio === 1.0) {
                    targetWidth = targetHeight = 1080;
                } else if (bestRatio === 0.8) {
                    targetWidth = 1080;
                    targetHeight = 1350;
                } else { // 1.91
                    targetWidth = 1080;
                    targetHeight = Math.round(1080 / 1.91);
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // Fill background white
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, targetWidth, targetHeight);

                // Calculate scaling to "contain"
                const imgRatio = img.width / img.height;
                let drawWidth, drawHeight;

                if (imgRatio > bestRatio) {
                    // Image is wider than target
                    drawWidth = targetWidth;
                    drawHeight = targetWidth / imgRatio;
                } else {
                    // Image is taller than target
                    drawHeight = targetHeight;
                    drawWidth = targetHeight * imgRatio;
                }

                const x = (targetWidth - drawWidth) / 2;
                const y = (targetHeight - drawHeight) / 2;

                ctx.drawImage(img, x, y, drawWidth, drawHeight);

                const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
                const newFile = new File([blob], this.originalFiles[i].name, { type: 'image/jpeg' });

                processedFiles.push(newFile);
                processedUrls.push(canvas.toDataURL('image/jpeg', 0.9));
            }

            this.selectedFiles = processedFiles;
            this.previewUrls = processedUrls;
        } catch (error) {
            console.error('Error processing images:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    moveFile(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.selectedFiles.length) return;
        this.reorderItems(index, newIndex);
    }

    private reorderItems(fromIndex: number, toIndex: number) {
        if (fromIndex === toIndex) return;

        // Move originalFile
        const [file] = this.originalFiles.splice(fromIndex, 1);
        this.originalFiles.splice(toIndex, 0, file);

        this.processImages();
    }

    draggedIndex: number | null = null;

    onDragStart(index: number) {
        this.draggedIndex = index;
    }

    onDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        if (this.draggedIndex === null || this.draggedIndex === index) return;
    }

    onDrop(event: DragEvent, index: number) {
        event.preventDefault();
        if (this.draggedIndex !== null && this.draggedIndex !== index) {
            this.reorderItems(this.draggedIndex, index);
        }
        this.draggedIndex = null;
    }

    // Touch Support for Mobile Drag and Drop
    touchStartIndex: number | null = null;
    touchLastX = 0;
    touchLastY = 0;

    onTouchStart(index: number, event: TouchEvent) {
        this.touchStartIndex = index;
        this.touchLastX = event.touches[0].clientX;
        this.touchLastY = event.touches[0].clientY;
    }

    onTouchMove(event: TouchEvent) {
        if (this.touchStartIndex === null) return;
        event.preventDefault(); // Prevent scrolling

        // Find element under touch
        const touch = event.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const previewItem = element?.closest('.preview-item');

        if (previewItem) {
            const indexAttr = previewItem.getAttribute('data-index');
            if (indexAttr !== null) {
                const targetIndex = parseInt(indexAttr, 10);
                if (targetIndex !== this.touchStartIndex) {
                    this.reorderItems(this.touchStartIndex, targetIndex);
                    this.touchStartIndex = targetIndex; // Update start index to current position
                }
            }
        }
    }

    onTouchEnd() {
        this.touchStartIndex = null;
    }

    removeFile(index: number) {
        this.originalFiles.splice(index, 1);
        this.processImages();
    }

    onSubmit() {
        if (this.postForm.invalid || this.selectedFiles.length === 0) {
            this.postForm.markAllAsTouched();
            if (this.selectedFiles.length === 0) {
                alert('Please upload at least one photo first.');
            }
            return;
        }

        this.constructCaption();
        this.currentPreviewIndex = 0;
        this.showModal = true;
    }

    constructCaption() {
        const values = this.postForm.value;
        let contactStr = '';
        const username = this.currentUser?.username ? `@${this.currentUser.username}` : 'the owner';

        if (values.phone && values.useInstagram) {
            contactStr = `${values.phone} or ${username}`;
        } else if (values.phone) {
            contactStr = values.phone;
        } else if (values.useInstagram) {
            contactStr = `${username}`;
        }

        const userMsg = values.userCaption ? `\n\n${values.userCaption}` : '';
        this.generatedFullCaption = `Contact: ${contactStr}\nLocation: ${values.locationDetail}, ${values.city}${userMsg}\n\n${this.dynamicHashtags}`;
    }

    nextMedia() {
        if (this.currentPreviewIndex < this.previewUrls.length - 1) {
            this.currentPreviewIndex++;
        } else {
            this.currentPreviewIndex = 0;
        }
    }

    prevMedia() {
        if (this.currentPreviewIndex > 0) {
            this.currentPreviewIndex--;
        } else {
            this.currentPreviewIndex = this.previewUrls.length - 1;
        }
    }

    confirmUpload() {
        const formData = new FormData();
        this.selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        formData.append('caption', this.generatedFullCaption);
        formData.append('location', `${this.postForm.value.city}, Tamil Nadu`);
        formData.append('type', this.postForm.value.type);

        this.postStatusService.startUpload(formData);
        this.showModal = false;
        this.router.navigate(['/dashboard']);
    }

    closeModal() {
        this.showModal = false;
    }

    // Custom Dropdown Logic
    toggleDropdown(event: Event, dropdownId: string) {
        event.stopPropagation();
        this.activeDropdown = this.activeDropdown === dropdownId ? null : dropdownId;
    }

    selectOption(controlName: string, value: any) {
        this.postForm.get(controlName)?.setValue(value);
        this.activeDropdown = null;
    }

    getDisplayValue(controlName: string): string {
        const value = this.postForm.get(controlName)?.value;
        if (!value) return 'Select...';

        // Mapping for values that differ from labels
        const mappings: any = {
            'dog': 'Dog / Puppy',
            'cat': 'Cat / Kitten',
            'adoption': 'For Adoption',
            'missing': 'Missing Pet',
            'post': 'Post',
            'reel': 'Reel',
            'story': 'Story'
        };

        return mappings[value] || value;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick() {
        this.activeDropdown = null;
    }
}
