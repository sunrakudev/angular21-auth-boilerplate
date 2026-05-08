import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { AccountService } from '@app/_services';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private accountService: AccountService
    ) {}

    canActivate(route: ActivatedRouteSnapshot) {
        const account = this.accountService.accountValue;
        
        if (account) {
            const roles = route.data['roles'] as Array<string>;
            if (roles && !roles.includes(account.role!)) {
                this.router.navigate(['/']);
                return false;
            }
            return true;
        }

        this.router.navigate(['/account/login'], { queryParams: { returnUrl: route.url } });
        return false;
    }
}