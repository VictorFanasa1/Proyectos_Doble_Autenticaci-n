import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import {
  MsalModule,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import {
  PublicClientApplication,
  BrowserCacheLocation,
  LogLevel,
  IPublicClientApplication,
} from '@azure/msal-browser';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';

export function msalInstanceFactory(): IPublicClientApplication {
  const base = window.location.origin + environment.baseHref;
  return new PublicClientApplication({
    auth: {
      clientId:              environment.msal.clientId,
      authority:             `https://login.microsoftonline.com/${environment.msal.tenantId}`,
      redirectUri:           `${base}auth/callback`,
      postLogoutRedirectUri: base,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        logLevel:          LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function msalGuardConfigFactory(): MsalGuardConfiguration {
  return { interactionType: 'redirect' as any };
}

export function initializeMsal(msalService: MsalService) {
  return () => msalService.instance.initialize();
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AuthCallbackComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    MsalModule,
  ],
  providers: [
    { provide: MSAL_INSTANCE,           useFactory: msalInstanceFactory },
    { provide: MSAL_GUARD_CONFIG,       useFactory: msalGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useValue: null },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    {
      provide:    APP_INITIALIZER,
      useFactory: initializeMsal,
      deps:       [MsalService],
      multi:      true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
