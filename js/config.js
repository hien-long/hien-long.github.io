// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyCKysT8eZ3LJqyi7vCjoqQGIpjgTyt7HYg",
    authDomain: "loiyeuthuong-5bfab.firebaseapp.com",
    projectId: "loiyeuthuong-5bfab",
    storageBucket: "loiyeuthuong-5bfab.firebasestorage.app",
    messagingSenderId: "544284022045",
    appId: "1:544284022045:web:22f2eef2ed918d93707df4"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();