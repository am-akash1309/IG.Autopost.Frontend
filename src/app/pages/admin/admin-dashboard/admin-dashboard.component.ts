import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { DailyStatsComponent } from '../daily-stats/daily-stats.component';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, DailyStatsComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
    user: any = null;
    stats: any = null;
    loading: boolean = true;
    error: string | null = null;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.user = this.apiService.getUser();
        this.fetchStats();
    }

    fetchStats(): void {
        this.loading = true;
        this.apiService.getAdminStats().subscribe({
            next: (response) => {
                if (response.success) {
                    this.stats = response.stats;
                } else {
                    this.error = response.error || 'Failed to fetch stats';
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'An error occurred while fetching stats';
                this.loading = false;
                console.error(err);
            }
        });
    }
}
