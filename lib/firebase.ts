import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAMWoBe86qqZtlB5ip83YF0BrIsmORKKAU",
  authDomain: "maternaai-c6ba3.firebaseapp.com",
  projectId: "maternaai-c6ba3",
  storageBucket: "maternaai-c6ba3.firebasestorage.app",
  messagingSenderId: "323256473733",
  appId: "1:323256473733:web:15ecf111c57e5a588971ec",
  measurementId: "G-BK83P5Z0DZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
