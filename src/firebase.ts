import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDonoY5JLmED-sJQDaVktYSAs_TftjN-nA",
  authDomain: "antifinal-722a9.firebaseapp.com",
  databaseURL: "https://antifinal-722a9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "antifinal-722a9",
  storageBucket: "antifinal-722a9.firebasestorage.app",
  messagingSenderId: "266664137227",
  appId: "1:266664137227:web:9e9d3d195f35e794fbad0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database, ref, onValue, set, update };
