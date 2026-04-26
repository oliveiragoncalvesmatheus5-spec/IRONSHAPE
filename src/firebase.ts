import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache } from 'firebase/firestore';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Try IndexedDB persistent cache first (instant loads on return visits).
// Fall back to memory cache if IndexedDB is unavailable (private mode, old browsers, WebView).
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
  }
}

export { db };
