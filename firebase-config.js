// Firebase configuration for Essential Layer
// Replace these values with your Firebase project config from:
// Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "essential-layer.firebaseapp.com",
  projectId: "essential-layer",
  storageBucket: "essential-layer.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const analytics = firebase.analytics();
