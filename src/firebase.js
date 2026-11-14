import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCS58REgPZO-vdEJ5-n3Zjg4SZczQ3ngxE",
  authDomain: "smartlend-36dfd.firebaseapp.com",
  databaseURL: "https://smartlend-36dfd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartlend-36dfd",
  storageBucket: "smartlend-36dfd.firebasestorage.app",
  messagingSenderId: "129776842828",
  appId: "1:129776842828:web:404b2f348f299e41989ce9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);