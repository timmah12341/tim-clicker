// firebase.js - put your Firebase config below (client keys).
// Create project & enable Anonymous auth + Realtime Database. Then paste config.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// <-- REPLACE with your Firebase project's config (safe client values) -->
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  databaseURL: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
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
