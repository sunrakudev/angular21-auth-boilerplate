import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AlertComponent } from './_components';

import { appInitializer } from './_helpers';
import { JwtInterceptor } from './_helpers';
import { ErrorInterceptor } from './_helpers';
import { fakeBackendProvider } from './_helpers';
import { AccountService } from './_services';
import { environment } from '@environments/environment';

@NgModule({
    declarations: [
        App,
        AlertComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule
    ],
    providers: [
        { provide: APP_INITIALIZER, useFactory: appInitializer, deps: [AccountService], multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        ...(environment.production ? [] : [fakeBackendProvider])
    ],
    bootstrap: [App]
})
export class AppModule { }
