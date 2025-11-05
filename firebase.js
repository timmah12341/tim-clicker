// firebase.js - initialize Firebase app and export helpers
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs",
  authDomain: "tim-clicker.firebaseapp.com",
  databaseURL: "https://tim-clicker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tim-clicker",
  storageBucket: "tim-clicker.firebasedatabase.app",
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
    if(auth.currentUser){ _uid = auth.currentUser.uid; resolve(_uid); return; }
    signInAnonymously(auth).catch(()=>{});
    onAuthStateChanged(auth, user => { if(user){ _uid = user.uid; resolve(_uid);} else reject(new Error('auth')); });
  });
}

export async function createRoom(ownerName){
  const code = generateRoomCode();
  await set(ref(db, `rooms/${code}`), { created: Date.now(), owner: ownerName });
  return code;
}

export async function joinRoom(code, player){
  await set(ref(db, `rooms/${code}/players/${player.uid}`), player);
}

export function listenRoomPlayers(code, cb){
  return onValue(ref(db, `rooms/${code}/players`), snap => cb(snap.exists()? snap.val() : {}));
}

export async function sendChat(code, msgObj){
  const chatRef = ref(db, `rooms/${code}/chat`);
  await push(chatRef, msgObj);
}

export function listenChat(code, cb){
  return onValue(ref(db, `rooms/${code}/chat`), snap => cb(snap.exists()? snap.val() : {}));
}

export async function updatePlayer(code, uid, patch){
  await update(ref(db, `rooms/${code}/players/${uid}`), patch);
}

export async function writeGlobal(uid, data){
  await set(ref(db, `players/${uid}`), data);
}

export async function readRoomOnce(code){
  const s = await get(ref(db, `rooms/${code}`));
  return s.exists()? s.val() : null;
}

export function generateRoomCode(){
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s=""; for(let i=0;i<5;i++) s+=letters.charAt(Math.floor(Math.random()*letters.length)); return s;
}
export { db };
