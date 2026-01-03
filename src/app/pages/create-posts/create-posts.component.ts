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
    previewUrls: string[] = [];
    isUploading = false;
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

    onFileSelected(event: any) {
        const files = event.target.files;
        if (files) {
            const remainingSlots = 6 - this.selectedFiles.length;
            if (remainingSlots <= 0) {
                alert('Maximum 6 images allowed.');
                return;
            }

            const filesToProcess = Array.from(files).slice(0, remainingSlots);

            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i] as File;

                // Reject if not an image
                if (!file.type.startsWith('image/')) {
                    alert('Only images are allowed for now.');
                    continue;
                }

                this.selectedFiles.push(file);
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.previewUrls.push(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    moveFile(index: number, direction: 'up' | 'down') {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.selectedFiles.length) return;
        this.reorderItems(index, newIndex);
    }

    private reorderItems(fromIndex: number, toIndex: number) {
        if (fromIndex === toIndex) return;

        // Move selectedFile
        const [file] = this.selectedFiles.splice(fromIndex, 1);
        this.selectedFiles.splice(toIndex, 0, file);

        // Move previewUrl
        const [url] = this.previewUrls.splice(fromIndex, 1);
        this.previewUrls.splice(toIndex, 0, url);
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
        this.selectedFiles.splice(index, 1);
        this.previewUrls.splice(index, 1);
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
