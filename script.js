// script.js - Multiplayer Tim Clicker with rooms, chat, timupass
import { ensureAuth, createRoom, joinRoom, listenRoomPlayers, sendChat, listenChat, updatePlayer, writeGlobal, readRoomOnce, generateRoomCode } from './firebase.js';

/* DOM */
const nameInput = document.getElementById('nameInput');
const startSoloBtn = document.getElementById('startSoloBtn');
const openMultBtn = document.getElementById('openMultBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomInput = document.getElementById('roomInput');
const roomStatus = document.getElementById('roomStatus');
const playersList = document.getElementById('playersList');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const startBtn = document.getElementById('startSoloBtn');
const openLobbyBtn = document.getElementById('openLobbyBtn');
const openPassBtn = document.getElementById('openPassBtn');

const gamePanel = document.getElementById('gamePanel');
const localTim = document.getElementById('localTim');
const timsEl = document.getElementById('tims');
const cpsEl = document.getElementById('cps');
const playerLabel = document.getElementById('playerLabel');
const shopPanel = document.getElementById('shopPanel');
const shopList = document.getElementById('shopList');
const lobbyPanel = document.getElementById('lobbyPanel');
const passPanel = document.getElementById('passPanel');
const passBar = document.getElementById('passBar');

const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupText = document.getElementById('popupText');
const popupClose = document.getElementById('popupClose');
popupClose.onclick = ()=> popupOverlay.classList.add('hidden');

/* state */
let uid = null, name = null, roomCode = null;
let tims = Number(localStorage.getItem('tims') || 0);
let cps = Number(localStorage.getItem('cps') || 0);
let owned = JSON.parse(localStorage.getItem('owned') || '[]');
let timupass = JSON.parse(localStorage.getItem('timupass') || '{"active":false,"progress":0}');
let playersUnsub = null, chatUnsub = null;

/* upgrades */
const upgrades = [
  { id:'u1', name:'Tim-ema', baseCost:100, add:2, icon:'upgrade1.png' },
  { id:'u2', name:'Floatie', baseCost:500, add:8, icon:'upgrade2.png' },
  { id:'u3', name:':3', baseCost:2000, add:25, icon:'upgrade3.png' },
  { id:'u4', name:'Tim', baseCost:6000, add:70, icon:'upgrade4.png' },
  { id:'u5', name:'Depression', baseCost:15000, add:180, icon:'upgrade5.png' },
  { id:'u6', name:'Ball Guy Tim', baseCost:40000, add:450, icon:'upgrade6.png' },
  { id:'u7', name:'gorF', baseCost:120000, add:1200, icon:'upgrade7.png' },
  { id:'u8', name:'Tequilla', baseCost:300000, add:2500, icon:'upgrade8.png' }
];
function ownedCount(id){ const o = owned.find(x=>x.id===id); return o? o.count : 0; }
function increaseOwned(id){ let o = owned.find(x=>x.id===id); if(!o) owned.push({id,count:1}); else o.count++; saveLocal(); }

/* helpers */
function showPopup(title,text){ popupTitle.textContent=title; popupText.textContent=text; popupOverlay.classList.remove('hidden'); }
function format(n){ return Math.floor(n).toLocaleString(); }

/* init */
if(localStorage.getItem('playerName')){
  name = localStorage.getItem('playerName');
  document.getElementById('playerLabel').textContent = name;
}

/* start solo */
startSoloBtn.onclick = ()=>{
  const n = nameInput.value.trim(); if(!n) return showPopup('Name required','Type a name'); name = n; localStorage.setItem('playerName',name);
  enterSolo();
};

openMultBtn.onclick = ()=>{ lobbyPanel.classList.toggle('hidden'); };

/* create/join room */
createRoomBtn.onclick = async ()=>{
  const n = nameInput.value.trim() || 'Guest';
  await ensureAndAuth(n);
  const code = await createRoom(n);
  roomInput.value = code;
  await joinRoomFlow(code);
};
joinRoomBtn.onclick = async ()=>{
  const code = (roomInput.value || '').trim().toUpperCase(); if(!code) return showPopup('Room code','Enter a code'); await ensureAndAuth(nameInput.value || 'Guest'); await joinRoomFlow(code);
};

/* ensure auth */
async function ensureAndAuth(n){
  uid = await ensureAuth();
  name = n || name || 'Guest';
  document.getElementById('playerLabel').textContent = name;
  // write initial global record
  try{ await writeGlobal(uid, { name, tims, cps, lastSeen: Date.now() }); }catch(e){console.warn(e);}
}

/* join flow */
async function joinRoomFlow(code){
  roomCode = code;
  // set random position
  const x = 30 + Math.random()*40; const y = 30 + Math.random()*30;
  const playerObj = { uid, name, tims, cps, owned, x, y, lastSeen: Date.now(), timupass };
  try{ await joinRoom(roomCode, playerObj); }catch(e){ showPopup('Join failed','Could not join room'); return; }
  // show UI
  document.getElementById('loginBlock').classList.add('hidden');
  document.getElementById('gamePanel').classList.remove('hidden');
  lobbyPanel.classList.remove('hidden');
  shopPanel.classList.remove('hidden');
  roomStatus.textContent = 'Room: ' + roomCode;
  // listen players and chat
  if(playersUnsub) playersUnsub(); if(chatUnsub) chatUnsub();
  playersUnsub = listenRoomPlayers(roomCode, players => renderPlayersList(players));
  chatUnsub = listenChat(roomCode, chat => renderChat(chat));
  // save periodically
  setInterval(()=> savePlayerRoom(), 3000);
}

/* render players list */
def_placeholder = "PLACEHOLDER"  # placeholder to ensure content length
