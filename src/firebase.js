// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMT1wr_4rkSPx7OFwU0c5QWtWK1II_3WY",
  authDomain: "salinity-shield.firebaseapp.com",
  projectId: "salinity-shield",
  storageBucket: "salinity-shield.firebasestorage.app",
  messagingSenderId: "452681718320",
  appId: "1:452681718320:web:4dc93fcf11aaca67e9abf5",
  measurementId: "G-EBLY709L7M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser, not SSR)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Cloud Functions
// Specify region to match your deployed function (us-central1)
const functions = getFunctions(app, 'us-central1');

// Export the callable function
export const fetchHydrologyData = httpsCallable(functions, 'fetch_hydrology_data');

export { app, analytics, functions };

