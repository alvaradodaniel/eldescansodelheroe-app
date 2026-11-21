import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

const projectId = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? "demo-el-descanso";

if (process.env.NODE_ENV === "test") {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
}

export const adminApp = getApps()[0] ?? initializeApp({ projectId });
export const adminDb = getAdminFirestore(adminApp);
