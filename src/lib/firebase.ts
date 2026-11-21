import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const firebaseEnvironment = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getRequiredEnv(name: keyof typeof firebaseEnvironment): string {
  const value = firebaseEnvironment[name];

  if (!value) {
    throw new Error(
      `Missing required Firebase environment variable: ${name}. ` +
        "Copy .env.example to .env.local and provide the Firebase Web App configuration.",
    );
  }

  return value;
}

const isTest = import.meta.env.MODE === "test";
const useEmulators = import.meta.env.DEV && !isTest;
const projectId = isTest
  ? "demo-el-descanso"
  : firebaseEnvironment.VITE_FIREBASE_PROJECT_ID || (useEmulators ? "demo-el-descanso" : "");
if (useEmulators && projectId !== "demo-el-descanso") {
  throw new Error("Development is restricted to the demo-el-descanso Firebase project.");
}
const firebaseConfig: FirebaseConfig =
  useEmulators || isTest
    ? {
        apiKey: firebaseEnvironment.VITE_FIREBASE_API_KEY || "demo-api-key",
        authDomain:
          firebaseEnvironment.VITE_FIREBASE_AUTH_DOMAIN || "demo-el-descanso.firebaseapp.com",
        projectId,
        storageBucket:
          firebaseEnvironment.VITE_FIREBASE_STORAGE_BUCKET || "demo-el-descanso.appspot.com",
        messagingSenderId:
          firebaseEnvironment.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
        appId: firebaseEnvironment.VITE_FIREBASE_APP_ID || "1:000000000000:web:demo",
      }
    : {
        apiKey: getRequiredEnv("VITE_FIREBASE_API_KEY"),
        authDomain: getRequiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
        projectId: getRequiredEnv("VITE_FIREBASE_PROJECT_ID"),
        storageBucket: getRequiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
        messagingSenderId: getRequiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
        appId: getRequiredEnv("VITE_FIREBASE_APP_ID"),
      };

export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firebaseFirestore: Firestore = getFirestore(firebaseApp);
export const firebaseFunctions: Functions = getFunctions(firebaseApp, "us-south1");

if (useEmulators && typeof window !== "undefined") {
  connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firebaseFirestore, "127.0.0.1", 8080);
  connectFunctionsEmulator(firebaseFunctions, "127.0.0.1", 5001);
}
