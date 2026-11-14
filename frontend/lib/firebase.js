"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const isEmulator = Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST);

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (isEmulator ? "demo-api-key" : undefined),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (isEmulator ? "demo-auth-domain" : undefined),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (isEmulator ? "demo-ssv" : undefined),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || (isEmulator ? "demo-app-id" : undefined),
};
export const firebaseReady = Object.values(config).every(Boolean);
export const firebaseApp = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(config)
  : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

if (firebaseAuth && isEmulator) {
  try {
    connectAuthEmulator(
      firebaseAuth,
      `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`,
      { disableWarnings: true }
    );
  } catch {
    // Emulator might already be connected
  }
}

