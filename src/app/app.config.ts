import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { initializeFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http';

// Registramos el locale español para que los pipes de fecha (date)
// muestren los nombres de mes/día en español
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [

    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    // Idioma por defecto de la aplicación (afecta pipes como date, currency, etc.)
    { provide: LOCALE_ID, useValue: 'es' },


    // Configuración de Firebase
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'ingenieria-para-todos-ups-1808',
        appId: '1:441710539689:web:d6c09c078a5723fbd14ab8',
        storageBucket: 'ingenieria-para-todos-ups-1808.firebasestorage.app',
        apiKey: 'AIzaSyB5Sv8ofR5GlrLaf5ICN155Fylns1crnoE',
        authDomain: 'ingenieria-para-todos-ups-1808.firebaseapp.com',
        messagingSenderId: '441710539689',
      }),
    ),


    // Autenticación con Firebase (Gmail / correo y contraseña)
    provideAuth(() => getAuth()),


    // Base de datos Firestore
    // Se usa initializeFirestore en vez de getFirestore para forzar
    // long-polling automático y evitar que extensiones tipo AdBlock
    // bloqueen el canal de comunicación (net::ERR_BLOCKED_BY_CLIENT)
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        experimentalAutoDetectLongPolling: true,
      }),
    ),


    // Cliente HTTP para comunicarse con servicios externos como Cloudinary
    provideHttpClient(),

  ],
};