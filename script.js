// script.js - Tim Clicker merged, neon theme, admin modal, no daily rewards
import {
  loginEmail,
  signupEmail,
  guestLogin,
  writePlayer,
  readPlayer,
  readPlayersOnce,
  onPlayers,
  broadcastMessage,
  kickPlayer,
  resetPlayer,
  giveUpgradeToAll,
  db,
  logout
} from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/11.11.0/firebase-database.js";

/* DOM refs */
const authPanel = document.getElementById('authPanel');
const emailIn = document.getElementById('email');
const passIn = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const guestBtn = document.getElementById('guestBtn');
const keepCb = document.getElementById('keepLogin');
const authMsg = document.getElementById('authMsg');

const playerPanel = document.getElementById('playerPanel');
const playerNameEl = document.getElementById('playerName');
const timImg = document.getElementById('timImg');
const orbit = document.getElementById('orbit');
const timsEl = document.getElementById('tims');
const cpsEl = document.getElementById('cps');
const shopList = document.getElementById('shopList');
const leaderboardEl = document.getElementById('leaderboard');

const adminButton = document.getElementById('adminButton');
const adminModal = document.getElementById('adminModal');
const closeAdmin = document.getElementById('closeAdmin');
const toastContainer = document.getElementById('toastContainer');
const logoutBtn = document.getElementById('logoutBtn');

let uid = null;
let email = null;
let player = { name:'Guest', tims:0, cps:0, owned:[], skin:'cookie.png' };

/* Upgrades */
const upgrades = [
  { id:'u1', name:'Tim-ema', baseCost:100, add:2, icon:'upgrade1.png' },
  { id:'u2', name:'Floatie', baseCost:500, add:8, icon:'upgrade2.png' },
  { id:'u3', name:':3', baseCost:2000, add:25, icon:'upgrade3.png' },
  { id:'u4', name:'Tim', baseCost:6000, add:70, icon:'upgrade4.png' },
  { id:'u5', name:'Depression', baseCost:15000, add:180, icon:'upgrade5.png' },
  { id:'u6', name:'Ball Guy Tim', baseCost:40000, add:450, icon:'upgrade6.png' },
  { id:'u7', name:'Johan', baseCost:120000, add:1200, icon:'upgrade7.png' },
  { id:'u8', name:'Tequilla', baseCost:400000, add:10000, icon:'upgrade8.png' },
  { id:'u9', name:'Golden Tim', baseCost:1000000, add:50000, icon:'upgrade9.png' },
  { id:'u10', name:'Minecraft Steve', baseCost:5000000, add:250000, icon:'upgrade10.png' },
  { id:'u11', name:'ADMIN ABUSE TIM', baseCost:10000000, add:1000000, icon:'upgrade11.png' },
];

/* Helpers */
function showToast(msg, opts={}) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  if(opts.adminOnly) d.style.border = '2px solid rgba(255,255,255,0.06)';
  toastContainer.appendChild(d);
  setTimeout(()=>d.remove(), 3500);
}

/* AUTH actions */
loginBtn.onclick = async () => {
  try {
    authMsg.textContent = 'Signing in...';
    uid = await loginEmail(emailIn.value.trim(), passIn.value, keepCb.checked);
    email = emailIn.value.trim().toLowerCase();
    await loadPlayer();
    authMsg.textContent = '';
    showGame();
  } catch (err) {
    console.error('login error', err);
    authMsg.textContent = 'Login failed: '+ (err.message||err);
  }
};
signupBtn.onclick = async () => {
  try {
    authMsg.textContent = 'Creating...';
    uid = await signupEmail(emailIn.value.trim(), passIn.value, keepCb.checked);
    email = emailIn.value.trim().toLowerCase();
    player = { name: email.split('@')[0], tims:0, cps:0, owned:[], skin:'cookie.png' };
    await writePlayer(uid, player);
    authMsg.textContent = '';
    showGame();
  } catch (err) {
    console.error('signup error', err);
    authMsg.textContent = 'Signup failed: '+ (err.message||err);
  }
};
guestBtn.onclick = async () => {
  try {
    authMsg.textContent = 'Signing in...';
    uid = await guestLogin();
    email = null;
    await loadPlayer();
    authMsg.textContent = '';
    showGame();
  } catch (err) {
    console.error('guest login', err);
    authMsg.textContent = 'Guest login failed';
  }
};

logoutBtn.onclick = () => {
  logout();
  location.reload();
};

/* Load player data from DB or create default */
async function loadPlayer() {
  if(!uid) {
    console.warn('loadPlayer called without uid');
    return;
  }
  const remote = await readPlayer(uid);
  if(remote) {
    player = Object.assign({ name:'Guest', tims:0, cps:0, owned:[], skin:'cookie.png' }, remote);
    player.owned = (player.owned||[]).filter(o => upgrades.some(u => u.id === o.id));
  } else {
    player = { name: email ? email.split('@')[0] : 'Guest', tims:0, cps:0, owned:[], skin:'cookie.png' };
    await writePlayer(uid, player);
  }
  // admin visibility
  if(email === 'timfinke01@gmail.com') {
    adminButton.classList.remove('hidden');
    showToast('👋 Welcome back, Admin Tim!', { adminOnly: true });
  } else {
    adminButton.classList.add('hidden');
  }
  onPlayers(obj => renderLeaderboard(obj));
  subscribeGlobal();
  subscribeKicks(uid);
  renderAll();
}

/* UI show/hide */
function showAuth(){ authPanel.classList.remove('hidden'); playerPanel.classList.add('hidden'); document.getElementById('gamePanel').classList.add('hidden'); }
function showGame(){ authPanel.classList.add('hidden'); playerPanel.classList.remove('hidden'); document.getElementById('gamePanel').classList.remove('hidden'); logoutBtn.classList.remove('hidden'); }

/* Render UI */
function renderAll(){
  playerNameEl.textContent = player.name || 'Guest';
  timsEl.textContent = Math.floor(player.tims || 0);
  cpsEl.textContent = player.cps || 0;
  timImg.src = player.skin || 'cookie.png';
  buildShop();
  renderOrbit();
  renderJohan();
}

/* Clicking Tim */
timImg.onclick = async () => {
  player.tims = (player.tims || 0) + 1;
  spawnClickFx();
  await savePlayer();
  renderAll();
};

/* Shop */
function buildShop(){
  if(!shopList) return;
  shopList.innerHTML = '';
  upgrades.forEach(u => {
    const cnt = (player.owned || []).find(x => x.id === u.id)?.count || 0;
    const cost = Math.max(1, Math.round(u.baseCost * Math.pow(1.25, cnt)));
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `<div style="display:flex;align-items:center">
      <img src="${u.icon}" width="44" height="44" onerror="this.src='cookie.png'">
      <div style="margin-left:8px"><strong>${u.name}</strong><div>${u.add} CPS</div></div>
    </div>
    <div><div>${cost} Tims</div><button data-id="${u.id}">Buy</button></div>`;
    div.querySelector('button').onclick = async () => {
      if(player.tims < cost){ showToast('Not enough Tims'); return; }
      player.tims -= cost;
      player.cps = (player.cps || 0) + u.add;
      addOwned(u.id);
      await savePlayer();
      renderAll();
    };
    shopList.appendChild(div);
  });
}
function addOwned(id){
  const o = (player.owned || []).find(x => x.id === id);
  if(o) o.count = (o.count||0) + 1;
  else player.owned.push({ id, count: 1 });
}

/* Orbit rendering */
function renderOrbit(){
  orbit.innerHTML = '';
  const base = 110;
  (player.owned || []).forEach((o, idx) => {
    const u = upgrades.find(x => x.id === o.id);
    if(!u) return;
    const icons = Math.min(6, o.count);
    for(let i=0;i<icons;i++){
      const el = document.createElement('div');
      el.className = 'orbit-item';
      const angle = (i/icons) * Math.PI * 2 + (idx*0.4) + (Date.now()/10000);
      const radius = base + idx*28;
      el.style.left = `calc(50% + ${Math.cos(angle)*radius}px)`;
      el.style.top  = `calc(50% + ${Math.sin(angle)*radius}px)`;
      const img = document.createElement('img');
      img.src = u.icon;
      img.style.width = '100%';
      img.style.height = '100%';
      img.onerror = () => { img.src = 'cookie.png'; };
      el.appendChild(img);
      orbit.appendChild(el);
      el.style.animation = `rotate ${8 + idx*1.4}s linear infinite`;
    }
  });
  if(!document.getElementById('orbitKey')){
    const s = document.createElement('style');
    s.id = 'orbitKey';
    s.textContent = '@keyframes rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
}

/* Johan shown near player name */
function renderJohan(){
  const slot = document.getElementById('johanSlot');
  slot.innerHTML = '';
  if((player.owned || []).some(o => o.id === 'u7')){
    const img = document.createElement('img');
    img.src = 'upgrade7.png';
    img.width = 36;
    img.height = 36;
    img.title = 'Johan';
    img.onerror = () => img.src = 'cookie.png';
    slot.appendChild(img);
  }
}

/* Click visual */
function spawnClickFx(){
  const p = document.createElement('div');
  p.textContent = '+1';
  p.style.position='fixed';
  p.style.left='50%';
  p.style.top='40%';
  p.style.transform='translate(-50%,-50%)';
  p.style.color='#ffd6ff';
  p.style.fontWeight='700';
  p.style.pointerEvents='none';
  document.body.appendChild(p);
  p.animate([{opacity:1, transform:'translate(-50%,-50%)'},{opacity:0, transform:'translate(-50%,-180%)'}],{duration:900}).onfinish = ()=>p.remove();
}

/* Leaderboard */
function renderLeaderboard(obj){
  const arr = Object.entries(obj||{}).map(([k,v])=>({uid:k,name:v.name||'Guest',tims:v.tims||0})).sort((a,b)=>b.tims-a.tims).slice(0,10);
  leaderboardEl.innerHTML = '';
  arr.forEach((p,i)=>{ const li=document.createElement('li'); li.textContent = `${i+1}. ${p.name} — ${p.tims}`; leaderboardEl.appendChild(li); });
}
async function buildLeaderInit(){ try{ const obj = await readPlayersOnce(); renderLeaderboard(obj); }catch(e){ console.warn(e); } }

/* SUBSCRIBERS: global messages, kicks */
function subscribeGlobal(){
  const r = ref(db, 'globalMessage');
  onValue(r, snap => {
    if(!snap.exists()) return;
    const m = snap.val();
    if(m.text) showGlobalToast(m.text);
    if(m.event === 'disco') startDisco();
    if(m.event === 'rainbow') rainbowFlash();
    if(m.event === 'confetti') confetti();
    if(m.event === 'boost') applyGlobalBoost(m.duration || 60);
  });
}

function showGlobalToast(txt){
  const t = document.createElement('div'); t.className='toast'; t.textContent = txt; toastContainer.appendChild(t); setTimeout(()=>t.remove(), 4000);
}

function subscribeKicks(myUid){
  if(!myUid) return;
  const r = ref(db, `users/${myUid}/kicked`);
  onValue(r, snap => {
    if(!snap.exists()) return;
    // Admin-only messages only; players are just disconnected (reload)
    console.warn('kicked:', snap.val());
    location.reload();
  });
}

/* ADMIN UI wiring */
adminButton.onclick = () => {
  adminModal.classList.remove('hidden');
};
closeAdmin.onclick = () => adminModal.classList.add('hidden');

document.getElementById('adminBroadcast').onclick = async () => {
  const txt = document.getElementById('adminMsg').value.trim(); if(!txt) return alert('Enter message');
  await broadcastMessage(uid, txt);
  showToast('Broadcast sent (admin)');
};
document.getElementById('adminGive').onclick = async () => {
  const id = document.getElementById('adminUpgradeId').value.trim(); if(!id) return alert('Enter id');
  await giveUpgradeToAll(id);
  showToast('Given to all (admin)');
};
document.getElementById('adminKick').onclick = async () => {
  const tgt = document.getElementById('adminTarget').value.trim(); if(!tgt) return alert('Enter target');
  const found = await resolveUid(tgt); if(!found) return alert('Not found');
  await kickPlayer(found, uid, 'Admin');
  showToast('Kicked (admin)');
};
document.getElementById('adminReset').onclick = async () => {
  const tgt = document.getElementById('adminTarget').value.trim(); if(!tgt) return alert('Enter target');
  const found = await resolveUid(tgt); if(!found) return alert('Not found');
  if(!confirm('Reset player?')) return;
  await resetPlayer(found);
  showToast('Reset (admin)');
};
document.getElementById('adminDisco').onclick = async () => {
  await broadcastMessage(uid, 'Disco started!', 'disco');
  showToast('Disco triggered (global)');
};
document.getElementById('adminRainbow').onclick = async () => {
  await broadcastMessage(uid, 'Rainbow flash!', 'rainbow');
  showToast('Rainbow triggered (global)');
};
document.getElementById('adminConfetti').onclick = async () => {
  await broadcastMessage(uid, 'Confetti!', 'confetti');
  showToast('Confetti triggered (global)');
};

/* Resolve uid by name or uid */
async function resolveUid(q){
  if(!q) return null;
  const all = await readPlayersOnce();
  for(const [k,v] of Object.entries(all || {})){
    if(v.name && v.name.toLowerCase() === q.toLowerCase()) return k;
  }
  if(all[q]) return q;
  return null;
}

/* Visual effects */
function startDisco(){
  document.body.style.transition='background 0.25s';
  let i=0;
  const iv = setInterval(()=>{ document.body.style.background = `linear-gradient(90deg, hsl(${i%360} 80% 35%), #050007)`; i+=30; },120);
  setTimeout(()=>{ clearInterval(iv); document.body.style.background = 'radial-gradient(circle at 10% 10%, #0b0015 0%, #050007 40%, #030006 100%)'; }, 12000);
}
function rainbowFlash(){
  document.documentElement.style.filter='hue-rotate(90deg)';
  setTimeout(()=>document.documentElement.style.filter='none', 7000);
}
function confetti(){
  for(let i=0;i<80;i++){
    const d = document.createElement('div');
    d.style.position='fixed';
    d.style.left = Math.random()*100+'%';
    d.style.top = '-10px';
    d.style.width = '8px';
    d.style.height = '12px';
    d.style.background = ['#ff6b6b','#ffd93d','#6bffb1','#6bd0ff'][Math.floor(Math.random()*4)];
    d.style.zIndex = 250;
    document.body.appendChild(d);
    d.animate([{transform:'translateY(0)'},{transform:'translateY(110vh)'}], {
      duration: 3000 + Math.random()*2000
    }).onfinish = ()=>d.remove();
  }
}

/* Boost: temporarily double CPS for this player (server-side global boost handled by event) */
function applyGlobalBoost(seconds){
  player.cps = Math.floor((player.cps || 0) * 2);
  setTimeout(()=>{ player.cps = Math.max(0, Math.floor((player.cps || 0)/2)); savePlayer(); renderAll(); }, seconds*1000);
  renderAll();
  savePlayer();
}

/* Autosave loop (1s) */
setInterval(async () => {
  if(!player) return;
  player.tims = (player.tims || 0) + (player.cps || 0);
  renderAll();
  await savePlayer();
}, 1000);

async function savePlayer(){
  if(!uid) return;
  try{ await writePlayer(uid, player); } catch(e){ console.error('savePlayer error', e); }
}

/* Init animated orbs */
const bg = document.getElementById('bg-animated');
function spawnOrbs(){ for(let i=0;i<14;i++){
  const el = document.createElement('div');
  el.className = 'bg-orb';
  el.style.left = Math.random()*100 + '%';
  el.style.top = Math.random()*100 + '%';
  el.style.width = (80 + Math.random()*220) + 'px';
  el.style.height = el.style.width;
  el.style.background = 'radial-gradient(circle at 30% 30%, rgba(180,92,255,0.9), rgba(80,40,200,0.6))';
  bg.appendChild(el);
  setTimeout(()=>el.remove(), 60000);
}}
spawnOrbs();

/* Initial view */
showAuth();
buildLeaderInit();
