// firebase.js - Realtime DB + Anonymous auth (v11 web modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, child, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

let _uid = null;
export function ensureAuth(){
  return new Promise((resolve,reject)=>{
    if (auth.currentUser){ _uid = auth.currentUser.uid; resolve(_uid); return; }
    signInAnonymously(auth).catch(()=>{});
    onAuthStateChanged(auth, user => { if(user){ _uid = user.uid; resolve(_uid); } else reject(new Error('auth fail'))});
  });
}

// room and player helpers
export async function createRoom(ownerName){
  const code = generateRoomCode();
  const roomRef = ref(db, `rooms/${code}`);
  await set(roomRef, { created: Date.now(), ownerName });
  return code;
}

export async function joinRoom(code, player){
  // player = { uid, name, tims, cps, owned, x,y }
  const pRef = ref(db, `rooms/${code}/players/${player.uid}`);
  await set(pRef, player);
}

export function listenRoomPlayers(code, cb){
  return onValue(ref(db, `rooms/${code}/players`), snap => cb(snap.exists()? snap.val() : {}));
}

export async function updatePlayerInRoom(code, uid, patch){
  const r = ref(db, `rooms/${code}/players/${uid}`);
  await update(r, patch);
}

export async function writeGlobalPlayer(uid, data){
  await set(ref(db, `players/${uid}`), data);
}

export async function readRoomOnce(code){
  const s = await get(ref(db, `rooms/${code}`));
  return s.exists()? s.val() : null;
}

export function generateRoomCode(){
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s="";
  for(let i=0;i<5;i++) s += letters.charAt(Math.floor(Math.random()*letters.length));
  return s;
}

export { db };
