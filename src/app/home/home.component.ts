import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  openInstagram(event: Event) {
    event.preventDefault();
    const username = 'coimbatore_pet_adoption';
    const appUrl = `instagram://user?username=${username}`;
    const webUrl = `https://www.instagram.com/${username}/`;

    // Simple detection for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Try to open in the app
      window.location.href = appUrl;

      // Fallback to web if the app doesn't open within a short time
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);
    } else {
      // Desktop - open web directly
      window.open(webUrl, '_blank');
    }
  }
}
