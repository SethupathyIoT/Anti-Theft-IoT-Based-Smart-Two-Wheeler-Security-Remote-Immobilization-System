import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC9Rla5-yBie75OE92rHPwpAAa2XgCP3lY",
  authDomain: "antitheft-9a300.firebaseapp.com",
  databaseURL: "https://antitheft-9a300-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "antitheft-9a300",
  storageBucket: "antitheft-9a300.firebasestorage.app",
  messagingSenderId: "831810246023",
  appId: "1:831810246023:web:0a498668d786477e0faf22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database, ref, onValue, set, update };
