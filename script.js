// script.js - Multiplayer Tim Clicker
import { ensureAuth, createRoom, joinRoom, listenRoomPlayers, updatePlayerInRoom, writeGlobalPlayer, generateRoomCode } from './firebase.js';

/* DOM */
const nameInput = document.getElementById('nameInput');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomInput = document.getElementById('roomInput');
const status = document.getElementById('status');
const gamePanel = document.getElementById('gamePanel');
const localTim = document.getElementById('localTim');
const timsEl = document.getElementById('tims');
const cpsEl = document.getElementById('cps');
const playerLabel = document.getElementById('playerLabel');
const shopPanel = document.getElementById('shopPanel');
const shopList = document.getElementById('shopList');
const orbitContainer = document.getElementById('orbitContainer');
const othersContainer = document.getElementById('othersContainer');
const bgImageHolder = document.getElementById('bgImageHolder');
const openShopBtn = document.getElementById('openShop');
const openMultiplayer = document.getElementById('openMultiplayer');
const openTimupass = document.getElementById('openTimupass');

const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupText = document.getElementById('popupText');
const popupClose = document.getElementById('popupClose');

function showPopup(title, text){ popupTitle.textContent = title; popupText.textContent = text; popupOverlay.classList.remove('hidden'); }
popupClose.onclick = ()=> popupOverlay.classList.add('hidden');

/* state */
let uid = null;
let name = null;
let roomCode = null;
let tims = Number(localStorage.getItem('tims') || 0);
let cps = Number(localStorage.getItem('cps') || 0);
let owned = JSON.parse(localStorage.getItem('owned') || '[]');
let timupass = JSON.parse(localStorage.getItem('timupass') || '{"active":false,"progress":0}');
let tequillaActive = false;

let roomUnsub = null;

/* upgrades */
const upgrades = [
  { id: 'u1', name: 'Tim-ema', baseCost: 100, add: 2, icon: 'upgrade1.png' },
  { id: 'u2', name: 'Floatie', baseCost: 500, add: 8, icon: 'upgrade2.png' },
  { id: 'u3', name: ':3', baseCost: 2000, add: 25, icon: 'upgrade3.png' },
  { id: 'u4', name: 'Tim', baseCost: 6000, add: 70, icon: 'upgrade4.png' },
  { id: 'u5', name: 'Depression', baseCost: 15000, add: 180, icon: 'upgrade5.png' },
  { id: 'u6', name: 'Ball Guy Tim', baseCost: 40000, add: 450, icon: 'upgrade6.png' },
  { id: 'u7', name: 'gorF', baseCost: 120000, add: 1200, icon: 'upgrade7.png' },
  { id: 'u8', name: 'Tequilla', baseCost: 300000, add: 2500, icon: 'upgrade8.png' }
];
function ownedCount(id){ const o = owned.find(x=>x.id===id); return o? o.count : 0; }
function increaseOwned(id){ let o = owned.find(x=>x.id===id); if(!o) owned.push({id,count:1}); else o.count++; saveLocal(); }

/* UI wiring */
openShopBtn.addEventListener('click', ()=> shopPanel.classList.toggle('hidden'));
openMultiplayer.addEventListener('click', ()=> showPopup('Multiplayer','Create or join a room to play with friends.'));
openTimupass.addEventListener('click', ()=> document.getElementById('passPanel').classList.toggle('hidden'));

/* create/join room */
createRoomBtn.onclick = async ()=>{
  name = (nameInput.value||'Guest').trim();
  if(!name) return showPopup('Name required','Please enter a name to create a room.');
  await ensureAndSetup();
  const code = await createRoom(name);
  roomInput.value = code;
  await joinRoomFlow(code);
};

joinRoomBtn.onclick = async ()=>{
  const code = (roomInput.value||'').trim().toUpperCase();
  if(!code) return showPopup('Enter code','Type a room code (e.g. ABCD2)');
  await ensureAndSetup();
  await joinRoomFlow(code);
};

/* ensure auth and initial write */
async function ensureAndSetup(){
  uid = await ensureAuth();
  name = nameInput.value.trim() || name || 'Guest';
  document.getElementById('status').textContent = 'Connected as ' + uid.slice(0,6);
}

/* join room logic */
async function joinRoomFlow(code){
  roomCode = code;
  // prepare player object with random position
  const x = 40 + Math.random()*20;
  const y = 40 + Math.random()*20;
  const playerObj = { uid, name, tims, cps, owned, x, y, lastSeen:Date.now(), timupass };
  try{
    await joinRoom(roomCode, playerObj);
  }catch(e){
    console.error(e); showPopup('Join failed','Could not join room.'); return;
  }
  setupGameUI();
  // listen for players
  if(roomUnsub) roomUnsub(); // not needed but keep
  roomUnsub = listenRoomPlayers(roomCode, (players)=>{
    renderOtherPlayers(players);
    renderLeaderboard(Object.values(players));
  });
}

/* build UI after join */
function setupGameUI(){
  document.getElementById('loginPanel').classList.add('hidden');
  document.getElementById('gamePanel').classList.remove('hidden');
  document.getElementById('shopPanel').classList.remove('hidden');
  playerLabel.textContent = name;
  timsEl.textContent = tims;
  cpsEl.textContent = cps;
  bgImageHolder.style.backgroundImage = "url('BgBg.png')";
  buildShop();
  renderOrbit();
  // periodic update of our remote player object
  setInterval(()=> savePlayerToRoom(), 2000);
}

/* save player to DB room */
async function savePlayerToRoom(){
  if(!roomCode || !uid) return;
  try{
    await updatePlayerInRoom(roomCode, uid, { tims, cps, owned, lastSeen: Date.now(), timupass });
  }catch(e){ console.warn('save room failed',e); }
  // also write global player record for leaderboard etc.
  try{ await writeGlobalPlayer(uid, { name, tims, cps, lastSeen: Date.now() }); }catch(e){}
}

/* render other players (avatars) */
function renderOtherPlayers(players){
  othersContainer.innerHTML = '';
  Object.values(players).forEach(p=>{
    if(!p || p.uid === uid) return;
    const el = document.createElement('div'); el.className='otherPlayer';
    // random or stored position
    const px = (p.x|| Math.random()*80 + 10);
    const py = (p.y|| Math.random()*60 + 20);
    el.style.left = px + '%';
    el.style.top = py + '%';
    el.innerHTML = `<img src="cookie.png" alt="${p.name}" /><div class="label">${p.name} — ${Math.floor(p.tims||0)}</div>`;
    othersContainer.appendChild(el);
  });
}

/* leaderboard in-room */
function renderLeaderboard(arr){
  const list = arr.sort((a,b)=> (b.tims||0)-(a.tims||0)).slice(0,12);
  const ol = document.getElementById('leaderboard');
  ol.innerHTML = '';
  list.forEach((p,idx)=>{ const li = document.createElement('li'); li.textContent = `${idx+1}. ${p.name} — ${Math.floor(p.tims||0)} Tims`; ol.appendChild(li); });
}

/* shop building and purchase */
function buildShop(){
  shopList.innerHTML = '';
  upgrades.forEach(u=>{
    const cnt = ownedCount(u.id) || 0;
    const cost = Math.round(u.baseCost * Math.pow(1.2, cnt));
    const div = document.createElement('div'); div.className = 'shop-item';
    div.innerHTML = `<div class="meta"><img src="${u.icon}" width="48" height="48"><div><strong>${u.name}</strong><div>${u.add} CPS</div></div></div><div><div>${cost} Tims</div><button class="buy-btn">Buy</button></div>`;
    div.querySelector('button').addEventListener('click', ()=> buyUpgrade(u.id));
    shopList.appendChild(div);
  });
}

function buyUpgrade(id){
  const u = upgrades.find(x=> x.id===id);
  const cnt = ownedCount(id);
  const cost = Math.round(u.baseCost * Math.pow(1.2, cnt));
  if(tims < cost) { showPopup('Not enough Tims','Earn more by clicking or passive CPS'); return; }
  tims -= cost;
  cps += u.add;
  increaseOwned(id);
  saveLocal();
  buildShop();
  renderOrbit();
  if(u.id === 'u8'){ // Tequilla: special effect
    triggerTequillaEffect();
  }
  showPopup('Purchased', `${u.name} bought! +${u.add} CPS`);
}

/* orbit rendering - non-clickable orbiting items */
function renderOrbit(){
  orbitContainer.innerHTML = '';
  const items = [];
  owned.forEach(o => {
    const u = upgrades.find(x=> x.id === o.id);
    if(u) for(let i=0;i<o.count;i++) items.push(u);
  });
  if(items.length === 0) return;
  const radius = 110;
  items.forEach((u,i)=>{
    const el = document.createElement('div'); el.className = 'orbit-item';
    const angle = (i/items.length)*Math.PI*2;
    const x = Math.cos(angle)*radius; const y = Math.sin(angle)*radius;
    el.style.position = 'absolute';
    el.style.left = `calc(50% + ${x}px - 28px)`;
    el.style.top = `calc(50% + ${y}px - 28px)`;
    // image is non-interactive (can't buy by clicking orbit)
    el.innerHTML = `<img src="${u.icon}" alt="${u.name}" style="pointer-events:none; width:56px; height:56px; border-radius:50%;">`;
    orbitContainer.appendChild(el);
  });
}

/* Tequilla special */
function triggerTequillaEffect(){
  const app = document.getElementById('app');
  app.classList.add('tequilla-wobble');
  // rainbow hue rotate for a while
  let t=0;
  const id = setInterval(()=>{ t+=10; app.style.filter = `hue-rotate(${t}deg)`; }, 80);
  setTimeout(()=>{ clearInterval(id); app.style.filter = ''; app.classList.remove('tequilla-wobble'); }, 12000);
}

/* click local Tim */
localTim.onclick = ()=>{
  tims += 1;
  document.getElementById('tims').textContent = tims;
  spawnClickParticles();
  saveLocal();
  savePlayerToRoom();
};

/* particles on click */
function spawnClickParticles(){
  const cnt = 12;
  for(let i=0;i<cnt;i++){
    const p = document.createElement('div');
    p.className = 'click-p';
    p.style.position='absolute'; p.style.left = (50 + Math.random()*40 -20) + '%'; p.style.top = (50 + Math.random()*40 -20) + '%';
    p.style.color = '#ff99ff'; p.textContent = '+1';
    document.getElementById('playStage').appendChild(p);
    setTimeout(()=> p.remove(), 900);
  }
}

/* local save/load */
function saveLocal(){
  localStorage.setItem('tims', tims);
  localStorage.setItem('cps', cps);
  localStorage.setItem('owned', JSON.stringify(owned));
  localStorage.setItem('timupass', JSON.stringify(timupass));
}
function loadLocal(){
  tims = Number(localStorage.getItem('tims') || 0);
  cps = Number(localStorage.getItem('cps') || 0);
  owned = JSON.parse(localStorage.getItem('owned') || '[]');
  timupass = JSON.parse(localStorage.getItem('timupass') || '{"active":false,"progress":0}');
}

/* passive CPS loop */
setInterval(()=>{
  tims += cps;
  document.getElementById('tims').textContent = Math.floor(tims);
}, 1000);

/* autosave */
setInterval(()=>{ saveLocal(); savePlayerToRoom(); }, 5000);

/* load local on start */
loadLocal();
buildShop();
renderOrbit();

/* helper: save player record to room if present */
async function savePlayerToRoom(){
  if(!roomCode || !uid) return;
  try{ await updatePlayerInRoom(roomCode, uid, { tims, cps, owned, lastSeen: Date.now(), timupass }); }catch(e){}
}

/* quick keyboard cheat for fun (press P to add 1000) */
window.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='p'){ tims += 1000; showPopup('Cheat','+1000 Tims (dev)'); } });

/* small UI restore from local on load */
document.getElementById('tims').textContent = tims;
document.getElementById('cps').textContent = cps;
