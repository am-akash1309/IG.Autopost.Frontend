import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-daily-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './daily-stats.component.html',
    styleUrls: ["./daily-stats.component.css"]
})
export class DailyStatsComponent implements OnInit {
    history: any[] = [];
    loading: boolean = true;
    currentPage: number = 1;
    totalPages: number = 1;
    limit: number = 5;

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.fetchHistory();
    }

    fetchHistory(): void {
        this.loading = true;
        this.apiService.getDailyStats(this.currentPage, this.limit).subscribe({
            next: (response) => {
                if (response.success) {
                    this.history = response.data;
                    this.totalPages = Math.ceil(response.total_count / this.limit);
                }
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    changePage(page: number): void {
        this.currentPage = page;
        this.fetchHistory();
    }
}
