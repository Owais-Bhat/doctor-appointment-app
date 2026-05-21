import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-project',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'demo@example.com',
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  if (serviceAccount.privateKey) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  } else {
    initializeApp({
      projectId: serviceAccount.projectId,
    });
  }
}

export const adminAuth = getFirebaseAuth();
