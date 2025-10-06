// Firebase configuration - REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id-here",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const analytics = firebase.analytics();

    // Google Auth Provider
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    console.log('Firebase initialized successfully');
} else {
    console.warn('Firebase SDK not loaded');
}