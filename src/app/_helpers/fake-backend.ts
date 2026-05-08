import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';
import { Role } from '@app/_models';

const accountsKey = 'angular-auth-accounts';
let accounts: any[] = [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, body } = request;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/accounts/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/accounts/register') && method === 'POST':
                    return register();
                case url.endsWith('/accounts/verify-email') && method === 'POST':
                    return verifyEmail();
                default:
                    return next.handle(request);
            }
        }

        function authenticate() {
            const { email, password } = body;
            const account = accounts.find(x => x.email === email && x.password === password);
            if (!account) return error('Email or password is incorrect');
            return ok({ ...basicDetails(account), jwtToken: `fake-jwt-token.${btoa(JSON.stringify({ id: account.id, exp: Date.now() + 900000 }))}` });
        }

        function register() {
            const account = body;
            if (accounts.find(x => x.email === account.email)) {
                return error('Email already registered');
            }
            account.id = accounts.length + 1;
            account.role = accounts.length === 0 ? Role.Admin : Role.User;
            account.isVerified = false;
            account.verificationToken = Date.now().toString();
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return ok();
        }

        function verifyEmail() {
            const { token } = body;
            const account = accounts.find(x => x.verificationToken === token);
            if (!account) return error('Verification failed');
            account.isVerified = true;
            delete account.verificationToken;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return ok();
        }

        function ok(body?: any) {
            return of(new HttpResponse({ status: 200, body })).pipe(delay(500));
        }

        function error(message: string) {
            return throwError(() => ({ error: { message } })).pipe(materialize(), delay(500), dematerialize());
        }

        function basicDetails(account: any) {
            const { id, title, firstName, lastName, email, role } = account;
            return { id, title, firstName, lastName, email, role };
        }
    }
}

export const fakeBackendProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};