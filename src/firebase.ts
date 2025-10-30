// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_F3qIscP4jRW3s6Tp8kmHj649hZzrS3Q",
  authDomain: "migoyugo-e248a.firebaseapp.com",
  projectId: "migoyugo-e248a",
  storageBucket: "migoyugo-e248a.firebasestorage.app",
  messagingSenderId: "365638915767",
  appId: "1:365638915767:web:c1e8b465c3cc9d6bb81f32",
  databaseURL: "https://migoyugo-e248a-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

export { app };
export default app;