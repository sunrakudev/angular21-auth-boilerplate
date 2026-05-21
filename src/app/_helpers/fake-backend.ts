import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, materialize, dematerialize } from 'rxjs/operators';
import { AlertService } from '@app/_services';
import { Role } from '@app/_models';

const accountsKey = 'angular-auth-accounts';
let accounts: any[] = JSON.parse(localStorage.getItem(accountsKey) || '[]');

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
    constructor(private alertService: AlertService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const { url, method, body } = request;
        const alertService = this.alertService;

        return handleRoute();

        function handleRoute() {
            switch (true) {
                case url.endsWith('/accounts/authenticate') && method === 'POST':
                    return authenticate();
                case url.endsWith('/accounts/refresh-token') && method === 'POST':
                    return refreshToken();
                case url.endsWith('/accounts/revoke-token') && method === 'POST':
                    return revokeToken();
                case url.endsWith('/accounts/register') && method === 'POST':
                    return register();
                case url.endsWith('/accounts/verify-email') && method === 'POST':
                    return verifyEmail();
                case url.endsWith('/accounts/forgot-password') && method === 'POST':
                    return forgotPassword();
                case url.endsWith('/accounts/validate-reset-token') && method === 'POST':
                    return validateResetToken();
                case url.endsWith('/accounts/reset-password') && method === 'POST':
                    return resetPassword();
                case url.endsWith('/accounts') && method === 'GET':
                    return getAccounts();
                case url.match(/\/accounts\/\d+$/) && method === 'GET':
                    return getAccountById();
                case url.match(/\/accounts\/\d+$/) && method === 'PUT':
                    return updateAccount();
                case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
                    return deleteAccount();
                default:
                    return next.handle(request);
            }
        }

        function authenticate() {
            const { email, password } = body;
            const account = accounts.find(x => x.email === email && x.password === password && x.isVerified);
            if (!account) return error('Email or password is incorrect');
            account.refreshTokens = account.refreshTokens || [];
            const newRefreshToken = generateRefreshToken();
            account.refreshTokens.push(newRefreshToken);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            setRefreshTokenCookie(newRefreshToken);
            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function refreshToken() {
            const token = getRefreshToken();
            if (!token) return unauthorized();
            const account = accounts.find(x => x.refreshTokens?.includes(token));
            if (!account) return unauthorized();
            account.refreshTokens = account.refreshTokens.filter((t: string) => t !== token);
            const newRefreshToken = generateRefreshToken();
            account.refreshTokens.push(newRefreshToken);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            setRefreshTokenCookie(newRefreshToken);
            return ok({
                ...basicDetails(account),
                jwtToken: generateJwtToken(account)
            });
        }

        function revokeToken() {
            const token = getRefreshToken();
            if (!token) return unauthorized();
            const account = accounts.find(x => x.refreshTokens?.includes(token));
            if (account) {
                account.refreshTokens = account.refreshTokens.filter((t: string) => t !== token);
                localStorage.setItem(accountsKey, JSON.stringify(accounts));
            }
            clearRefreshTokenCookie();
            return ok();
        }

        function register() {
            const account = body;
            if (accounts.find(x => x.email === account.email)) {
                setTimeout(() => alertService.info(`
                    <h4>Email Already Registered</h4>
                    <p>The email <strong>${account.email}</strong> is already registered.</p>
                    <p>If you don't know your password, please visit the <a href="/account/forgot-password">forgot password</a> page.</p>
                `, { autoClose: false }));
                return ok();
            }

            account.id = accounts.length ? Math.max(...accounts.map((x: any) => x.id)) + 1 : 1;
            account.role = accounts.length === 0 ? Role.Admin : Role.User;
            account.isVerified = false;
            account.verificationToken = Date.now().toString();
            account.refreshTokens = [];
            delete account.confirmPassword;
            accounts.push(account);
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            setTimeout(() => alertService.info(`
                <h4>Verification Email</h4>
                <p>Thanks for registering!</p>
                <p>Please click the below link to verify your email address:</p>
                <p><a href="/account/verify-email?token=${account.verificationToken}">Verify Email</a></p>
            `, { autoClose: false }));

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

        function forgotPassword() {
            const { email } = body;
            const account = accounts.find(x => x.email === email);
            if (!account) return ok();
            account.resetToken = Date.now().toString();
            account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            localStorage.setItem(accountsKey, JSON.stringify(accounts));

            setTimeout(() => alertService.info(`
                <h4>Reset Password Email</h4>
                <p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                <p><a href="/account/reset-password?token=${account.resetToken}">Reset Password</a></p>
            `, { autoClose: false }));

            return ok();
        }

        function validateResetToken() {
            const { token } = body;
            const account = accounts.find(x =>
                x.resetToken === token &&
                new Date() < new Date(x.resetTokenExpires)
            );
            if (!account) return error('Invalid token');
            return ok();
        }

        function resetPassword() {
            const { token, password } = body;
            const account = accounts.find(x =>
                x.resetToken === token &&
                new Date() < new Date(x.resetTokenExpires)
            );
            if (!account) return error('Invalid token');
            account.password = password;
            delete account.resetToken;
            delete account.resetTokenExpires;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return ok();
        }

        function getAccounts() {
            if (!isAuthenticated()) return unauthorized();
            return ok(accounts.map(x => basicDetails(x)));
        }

        function getAccountById() {
            if (!isAuthenticated()) return unauthorized();
            const account = accounts.find(x => x.id === idFromUrl());
            return ok(basicDetails(account));
        }

        function updateAccount() {
            if (!isAuthenticated()) return unauthorized();
            const params = body;
            const account = accounts.find(x => x.id === idFromUrl());
            if (params.password) {
                account.password = params.password;
            }
            Object.assign(account, params);
            delete account.confirmPassword;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return ok(basicDetails(account));
        }

        function deleteAccount() {
            if (!isAuthenticated()) return unauthorized();
            accounts = accounts.filter(x => x.id !== idFromUrl());
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return ok();
        }

        function ok(body?: any) {
            return of(new HttpResponse({ status: 200, body })).pipe(delay(500));
        }

        function error(message: string) {
            return throwError(() => ({ error: { message } })).pipe(materialize(), delay(500), dematerialize());
        }

        function unauthorized() {
            return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } })).pipe(materialize(), delay(500), dematerialize());
        }

        function basicDetails(account: any) {
            const { id, title, firstName, lastName, email, role, isVerified } = account;
            return { id, title, firstName, lastName, email, role, isVerified };
        }

        function isAuthenticated() {
            const authHeader = request.headers.get('Authorization');
            return !!authHeader?.startsWith('Bearer fake-jwt-token.');
        }

        function idFromUrl() {
            const urlParts = url.split('/');
            return parseInt(urlParts[urlParts.length - 1]);
        }

        function generateJwtToken(account: any) {
            return `fake-jwt-token.${btoa(JSON.stringify({ id: account.id, exp: Math.round((Date.now() + 15 * 60 * 1000) / 1000) }))}`;
        }

        function generateRefreshToken() {
            return Date.now().toString();
        }

        function getRefreshToken(): string | null {
            const match = document.cookie.match(/fakeRefreshToken=([^;]+)/);
            return match ? match[1] : null;
        }

        function setRefreshTokenCookie(token: string) {
            document.cookie = `fakeRefreshToken=${token}; path=/`;
        }

        function clearRefreshTokenCookie() {
            document.cookie = 'fakeRefreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    }
}

export const fakeBackendProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};
