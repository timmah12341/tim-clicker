// firebase.js - modular (fixed CDN version 11.0.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
const db = getDatabase(app);
const auth = getAuth(app);

export async function loginEmail(email, password, keep){
  await setPersistence(auth, keep ? browserLocalPersistence : browserSessionPersistence);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

export async function signupEmail(email, password, keep){
  await setPersistence(auth, keep ? browserLocalPersistence : browserSessionPersistence);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

export async function guestLogin(){
  return new Promise((resolve,reject)=>{
    signInAnonymously(auth).catch(()=>{});
    const off = onAuthStateChanged(auth, user => { off(); if(user) resolve(user.uid); else reject(new Error('auth')); });
  });
}

export function logout(){ signOut(auth); }

export async function writePlayer(uid, data){ await set(ref(db, `users/${uid}`), data); }
export async function updatePlayer(uid, partial){ await update(ref(db, `users/${uid}`), partial); }
export async function readPlayer(uid){ const s = await get(ref(db, `users/${uid}`)); return s.exists()? s.val(): null; }
export async function readPlayersOnce(){ const s = await get(ref(db, `users`)); return s.exists()? s.val(): {}; }
export function onPlayers(cb){ return onValue(ref(db, `users`), snap => cb(snap.exists()? snap.val(): {})); }

export async function broadcastMessage(adminUid, text, event=null, extra={}){
  await set(ref(db, 'globalMessage'), { text, sentBy: adminUid, ts: Date.now(), event, extra });
}
export async function kickPlayer(targetUid, adminUid, reason='kicked'){
  await update(ref(db, `users/${targetUid}`), { kicked: { by: adminUid, reason, ts: Date.now() } });
}
export async function resetPlayer(targetUid){
  await set(ref(db, `users/${targetUid}`), { name:'', tims:0, cps:0, owned:[], skin:'cookie.png' });
}
export async function giveUpgradeToAll(upgradeId){
  const all = await readPlayersOnce();
  for(const uid of Object.keys(all || {})){
    const p = all[uid] || {};
    const owned = Array.isArray(p.owned)? p.owned : [];
    const idx = owned.findIndex(x=>x.id===upgradeId);
    if(idx>=0) owned[idx].count = (owned[idx].count||0)+1;
    else owned.push({id:upgradeId,count:1});
    await update(ref(db, `users/${uid}`), { owned });
  }
}

export { db, auth };
