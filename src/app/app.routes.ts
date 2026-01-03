import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { TermsComponent } from './pages/terms/terms.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CreatePostsComponent } from './pages/create-posts/create-posts.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { ManualReviewComponent } from './pages/admin/manual-review/manual-review.component';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/review', component: ManualReviewComponent, canActivate: [authGuard, adminGuard] },
    { path: 'create_posts', component: CreatePostsComponent, canActivate: [authGuard] },
    { path: 'privacy', component: PrivacyComponent },
    { path: 'terms', component: TermsComponent }
];
