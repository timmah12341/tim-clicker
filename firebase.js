// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs",
  authDomain: "tim-clicker.firebaseapp.com",
  databaseURL: "https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker",
  storageBucket: "tim-clicker.firebasestorage.app",
  messagingSenderId: "493561136507",
  appId: "1:493561136507:web:0a842da88e6a764624e9de",
  measurementId: "G-FTKCVMZH0Z",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

signInAnonymously(auth).catch(console.error);

export { db, ref, set, get, update, onValue };
