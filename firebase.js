// firebase.js - put your Firebase config below (client keys).
// Create project & enable Anonymous auth + Realtime Database. Then paste config.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// <-- REPLACE with your Firebase project's config (safe client values) -->
const firebaseConfig = {
  apiKey: "AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs",
  authDomain: "tim-clicker.firebaseapp.com",
  databaseURL: "https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker",
  storageBucket: "tim-clicker.firebasestorage.app",
  messagingSenderId: "493561136507",
  appId: "1:493561136507:web:0a842da88e6a764624e9de",
  measurementId: "G-FTKCVMZH0Z"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let _uid = null;
function ensureAuth(){
  return new Promise((resolve, reject) => {
    if (auth.currentUser){
      _uid = auth.currentUser.uid;
      resolve(_uid);
      return;
    }
    signInAnonymously(auth).catch((e)=>console.warn('anon sign-in failed', e));
    onAuthStateChanged(auth, user => {
      if (user){ _uid = user.uid; resolve(_uid); }
      else reject(new Error('auth failed'));
    });
  });
}

async function writePlayer(uid, data){
  try { await set(ref(db, 'players/' + uid), data); }
  catch(e){ console.warn('writePlayer failed', e); }
}

async function readPlayer(uid){
  try {
    const snap = await get(ref(db, 'players/' + uid));
    return snap.exists() ? snap.val() : null;
  } catch(e){ console.warn('readPlayer failed', e); return null; }
}

function onPlayersValue(cb){
  return onValue(ref(db, 'players'), snapshot => cb(snapshot.exists() ? snapshot.val() : {}));
}

export { ensureAuth, writePlayer, readPlayer, onPlayersValue, db };
