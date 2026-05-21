import { Component } from '@angular/core';
import { AccountService } from './_services';
import { Account } from './_models';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    standalone: false
})
export class App {
    account: Account | null = null;

    constructor(private accountService: AccountService) {
        this.accountService.account.subscribe(x => this.account = x);
    }

    logout() {
        this.accountService.logout();
    }
}
