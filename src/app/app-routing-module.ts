import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './_helpers';
import { Role } from './_models';

const routes: Routes = [
    { path: '', loadChildren: () => import('./home/home.module').then(x => x.HomeModule), canActivate: [AuthGuard] },
    { path: 'profile', loadChildren: () => import('./profile/profile.module').then(x => x.ProfileModule), canActivate: [AuthGuard] },
    { path: 'admin', loadChildren: () => import('./admin/admin.module').then(x => x.AdminModule), canActivate: [AuthGuard], data: { roles: [Role.Admin] } },
    { path: 'account', loadChildren: () => import('./account/account.module').then(x => x.AccountModule) },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
