import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE-FNV4SgU-7bTVTWUoMMmabP6u43S98Y",
  authDomain: "okoko-807c1.firebaseapp.com",
  projectId: "okoko-807c1",
  storageBucket: "okoko-807c1.firebasestorage.app",
  messagingSenderId: "392116406086",
  appId: "1:392116406086:web:a439f526a5f12cf66f4747",
  measurementId: "G-X1XKQLPQT2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };