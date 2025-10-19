// script.js - main game logic (HTML Tim Clicker Deluxe)
// Requires firebase.js in same folder with your config set
import { ensureAuth, writePlayer, readPlayer, onPlayersValue } from './firebase.js';

const APP_VERSION = 'Tim Clicker v2.0 (Timu)';
// DOM refs
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const gamePanel = document.getElementById('gamePanel');
const playerPanel = document.getElementById('playerPanel');
const cookie = document.getElementById('cookie');
const orbitContainer = document.getElementById('orbitContainer');
const cookiesSpan = document.getElementById('cookies');
const cpsSpan = document.getElementById('cps');
const shopList = document.getElementById('shopList');
const skinsList = document.getElementById('skinsList');
const leaderBoard = document.getElementById('leaderboard');
const shopPanel = document.getElementById('shopPanel');
const skinsPanel = document.getElementById('skinsPanel');
const leaderPanel = document.getElementById('leaderPanel');
const saveNameButton = document.getElementById('saveNameBtn');
const cookieWrap = document.getElementById('cookieWrap');
const enterUnderwaterBtn = document.getElementById('enterUnderwater');
const openTimuBtn = document.getElementById('openTimu');
const openMinigamesBtn = document.getElementById('openMinigames');
const minigamePanel = document.getElementById('minigamePanel');
const minigameArea = document.getElementById('minigameArea');
const launchClickRushBtn = document.getElementById('launchClickRush');
const launchTimJumpBtn = document.getElementById('launchTimJump');
const playerNameEl = document.getElementById('playerName');
const musicToggle = document.getElementById('musicToggle');

// canvas for particles
const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas(); window.addEventListener('resize', resizeCanvas);

// audio placeholders - replace with your mp3s (click.mp3, music.mp3)
const bgAudio = new Audio('music.mp3'); bgAudio.loop = true; bgAudio.volume = 0.25;
const clickAudio = new Audio('click.mp3'); clickAudio.volume = 0.6;
let musicOn = false;

// game state
let uid = null;
let playerName = localStorage.getItem('tim_name') || '';
let cookies = Number(localStorage.getItem('tim_cookies') || 0);
let cps = Number(localStorage.getItem('tim_cps') || 0);
let selectedSkin = localStorage.getItem('tim_skin') || 'cookie.png';
let underwater = (localStorage.getItem('tim_underwater') === '1');
let drunkUntil = Number(localStorage.getItem('tim_drunk') || 0);

// balanced upgrades - 10 items (no multipliers) and slower cost growth
let upgrades = [
  { id: 'u1', name: 'Cursor', cost: 50, add: 1, icon: 'upgrade1.png' },
  { id: 'u2', name: 'Grandma', cost: 150, add: 3, icon: 'upgrade2.png' },
  { id: 'u3', name: 'Factory', cost: 500, add: 8, icon: 'upgrade3.png' },
  { id: 'u4', name: 'Portal', cost: 2000, add: 20, icon: 'upgrade4.png' },
  { id: 'u5', name: 'Absolute Tim-ema', cost: 5000, add: 50, icon: 'upgrade5.png' },
  { id: 'u6', name: 'Ball Guys Tim', cost: 10000, add: 100, icon: 'upgrade6.png' },
  { id: 'u7', name: 'Floatieeee!', cost: 25000, add: 200, icon: 'upgrade7.png' },
  { id: 'u8', name: 'Tim and Alexander', cost: 50000, add: 400, icon: 'upgrade8.png' },
  { id: 'u9', name: 'Depression Upgrade', cost: 100000, add: 800, icon: 'upgrade9.png' },
  { id: 'u10', name: 'gorF', cost: 250000, add: 2000, icon: 'upgrade10.png' }
];

// skins list
let skins = [
  { id: 'cookie.png', name: 'Default' },
  { id: 'skin_tim.png', name: 'Tim-ema' },
  { id: 'skin_galaxy.png', name: 'Galaxy' }
];

// UI helpers
function show(el){ if(el) el.classList.remove('hidden'); }
function hide(el){ if(el) el.classList.add('hidden'); }

// init UI
document.getElementById('version').textContent = APP_VERSION;

// handle music toggle
musicToggle.addEventListener('click', ()=>{
  musicOn = !musicOn;
  if (musicOn) bgAudio.play().catch(()=>{});
  else bgAudio.pause();
  musicToggle.textContent = musicOn ? '🔇' : '🔊';
});

// save name
saveNameBtn.addEventListener('click', ()=>{
  const name = nameInput.value.trim();
  if(!name) { alert('Please enter a name'); return; }
  playerName = name;
  localStorage.setItem('tim_name', playerName);
  document.getElementById('playerName').textContent = playerName;
  hide(playerPanel);
  show(gamePanel); show(shopPanel); show(skinsPanel); show(leaderPanel);
  initAfterAuth();
});

// cookie click
cookie.addEventListener('click', ()=>{
  cookies += 1;
  spawnClickParticles(); playClick(); updateUI(); saveLocalAndRemote();
});

// buy upgrade
function renderShop(){ shopList.innerHTML = ''; upgrades.forEach(u => {
  const el = document.createElement('div'); el.className='shop-item';
  el.innerHTML = `<div class="meta"><img src="${u.icon}" width="48" height="48" alt="${u.name}" />
    <div><strong>${u.name}</strong><div style="font-size:12px;color:#ccc">${u.add} CPS</div></div></div>
    <div class="right"><div class="cost">${u.cost} 🍪</div><button data-id="${u.id}">Buy</button></div>`;
  el.querySelector('button').addEventListener('click', ()=> buyUpgrade(u.id));
  shopList.appendChild(el);
}); }

function renderSkins(){ skinsList.innerHTML=''; skins.forEach(s=>{
  const div = document.createElement('div'); div.className='skin' + (s.id===selectedSkin?' selected':'');
  div.innerHTML = `<img src="${s.id}" alt="${s.name}" /><div style="font-size:12px">${s.name}</div>`;
  div.addEventListener('click', ()=>{ selectedSkin = s.id; localStorage.setItem('tim_skin', selectedSkin); applySkin(); renderSkins(); });
  skinsList.appendChild(div);
}); }

function applySkin(){ cookie.src = selectedSkin || 'cookie.png'; }

function renderOrbit(){ orbitContainer.innerHTML=''; const center={x:orbitContainer.clientWidth/2,y:orbitContainer.clientHeight/2}; const radius=Math.min(orbitContainer.clientWidth,orbitContainer.clientHeight)/2 - 40;
  upgrades.forEach((u,i)=>{ const node=document.createElement('div'); node.className='orbit-item'; const angle=(i/upgrades.length)*Math.PI*2; const x=center.x+Math.cos(angle)*radius; const y=center.y+Math.sin(angle)*radius; node.style.left=`${x-32}px`; node.style.top=`${y-32}px`; node.style.animationDuration=`${8 + i*0.6}s`; node.innerHTML=`<img src="${u.icon}" title="${u.name} - ${u.cost} 🍪">`; node.addEventListener('click',(e)=>{ e.stopPropagation(); buyUpgrade(u.id); }); orbitContainer.appendChild(node); }); }

function buyUpgrade(id){ const u=upgrades.find(x=>x.id===id); if(!u) return; if(cookies>=u.cost){ cookies-=u.cost; cps+=u.add; u.cost = Math.max(1, Math.round(u.cost*1.25)); spawnUpgradeParticles(); playClick(); updateUI(); renderShop(); renderOrbit(); saveLocalAndRemote(); }else{ cookie.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:300}); } }

function updateUI(){ cookiesSpan.textContent = Math.floor(cookies); cpsSpan.textContent = cps; applySkin(); if(cookies>=10000) enterUnderwaterBtn.style.display='inline-block'; else enterUnderwaterBtn.style.display='none'; }

function saveLocal(){ localStorage.setItem('tim_cookies', Math.floor(cookies)); localStorage.setItem('tim_cps', cps); localStorage.setItem('tim_skin', selectedSkin); localStorage.setItem('tim_underwater', underwater ? '1' : '0'); localStorage.setItem('tim_drunk', drunkUntil || 0); }

async function saveLocalAndRemote(){ saveLocal(); if(uid && playerName){ await writePlayer(uid, { name: playerName, cookies: Math.floor(cookies), cps }); } }

setInterval(()=>{ cookies += cps; updateUI(); saveLocalAndRemote(); },1000);

// particles
let fxParticles=[]; function resizeCanvas(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; } function spawnClickParticles(){ const rect = cookie.getBoundingClientRect(); emitParticles(rect.left + rect.width/2, rect.top + rect.height/2, 12); } function spawnUpgradeParticles(){ const rect = cookie.getBoundingClientRect(); emitParticles(rect.left + rect.width/2, rect.top + rect.height/2, 20); } function emitParticles(x,y,n){ for(let i=0;i<n;i++){ fxParticles.push({ x,y, vx:(Math.random()-0.5)*6, vy:(Math.random()-1.5)*6, life:40+Math.random()*30, size:2+Math.random()*4, hue: Math.floor(30 + Math.random()*40) }); } } function stepParticles(){ ctx.clearRect(0,0,canvas.width,canvas.height); for(let i=fxParticles.length-1;i>=0;i--){ const p=fxParticles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life--; ctx.beginPath(); ctx.fillStyle = `hsl(${p.hue},80%,60%)`; ctx.globalAlpha = Math.max(0, p.life/70); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); if(p.life<=0) fxParticles.splice(i,1); } requestAnimationFrame(stepParticles); } stepParticles();

function playClick(){ try{ clickAudio.currentTime = 0; clickAudio.play(); }catch(e){} }

enterUnderwaterBtn.addEventListener('click', ()=>{ underwater = !underwater; document.body.classList.toggle('underwater', underwater); saveLocal(); alert(underwater ? 'Underwater mode: ON' : 'Underwater mode: OFF'); });

openTimuBtn.addEventListener('click', ()=>{ show(shopPanel); renderShop(); renderOrbit(); });

openMinigamesBtn.addEventListener('click', ()=>{ minigamePanel.classList.toggle('hidden'); });

launchClickRushBtn.addEventListener('click', ()=>{ minigameArea.innerHTML=''; const info=document.createElement('div'); info.innerHTML=`<p>Click as fast as you can for 10 seconds! Reward: 1 cookie per click.</p>`; const score=document.createElement('div'); score.style.fontSize='24px'; score.textContent='0'; const btn=document.createElement('button'); btn.textContent='Start Click Rush'; minigameArea.appendChild(info); minigameArea.appendChild(score); minigameArea.appendChild(btn); btn.onclick = ()=> { let clicks=0; btn.disabled=true; const minbtn=document.createElement('button'); minbtn.textContent='Click me!'; minigameArea.appendChild(minbtn); minbtn.onclick = ()=> { clicks++; score.textContent = clicks; playClick(); }; setTimeout(()=>{ minbtn.disabled=true; btn.disabled=false; const reward = clicks; cookies += reward; updateUI(); saveLocalAndRemote(); alert(`Click Rush ended! You got ${reward} bonus cookies.`); }, 10000); }; });

launchTimJumpBtn.addEventListener('click', ()=>{ minigameArea.innerHTML=''; const canvasMG=document.createElement('canvas'); canvasMG.width=400; canvasMG.height=200; canvasMG.style.border='1px solid #333'; minigameArea.appendChild(canvasMG); const mgCtx = canvasMG.getContext('2d'); let running=true; let y=150; let vy=0; let obstacles=[]; let timeLeft=20000; let last = performance.now(); function spawnObs(){ obstacles.push({x:420,w:20,h:30}); } let spawnTimer=0; function loop(t){ const dt = t-last; last=t; vy+=0.8; y+=vy; if(y>150){ y=150; vy=0; } spawnTimer+=dt; if(spawnTimer>1000){ spawnTimer=0; spawnObs(); } for(let i=obstacles.length-1;i>=0;i--){ obstacles[i].x -= dt*0.12; if(obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i,1); } for(const o of obstacles){ if(o.x < 80 && o.x + o.w > 40 && y > 130) { running=false; } } mgCtx.fillStyle='#001'; mgCtx.fillRect(0,0,canvasMG.width,canvasMG.height); mgCtx.fillStyle='#0ff'; mgCtx.beginPath(); mgCtx.arc(60,y,20,0,Math.PI*2); mgCtx.fill(); mgCtx.fillStyle='#f88'; obstacles.forEach(o=> mgCtx.fillRect(o.x,150-o.h,o.w,o.h)); timeLeft -= dt; if(timeLeft <= 0) running=false; if(running) requestAnimationFrame(loop); else { const reward = Math.max(5, Math.floor((20000 - Math.max(0,timeLeft))/1000)); cookies += reward; updateUI(); saveLocalAndRemote(); alert(`Minigame over! You earned ${reward} cookies.`); } } canvasMG.onclick = ()=> { if(y>=150) vy = -10; }; requestAnimationFrame(loop); });

function checkGorf(){ if(playerName && playerName.toLowerCase().includes('gorf')){ const g = upgrades.find(u=>u.name.toLowerCase().includes('gorf')); if(g) g.cost = Math.max(1, Math.round(g.cost*0.5)); renderShop(); renderOrbit(); } }

window.addEventListener('resize', renderOrbit);

// leaderboard
function subscribeLeaderboard(){ onPlayersValue(playersObj => { const arr = Object.values(playersObj || {}); arr.sort((a,b)=> (b.cookies||0) - (a.cookies||0)); leaderBoard.innerHTML=''; arr.slice(0,15).forEach((p,i)=>{ const li = document.createElement('li'); li.textContent = `${i+1}. ${p.name} — ${p.cookies || 0} 🍪`; leaderBoard.appendChild(li); }); }); }

// auth & sync
async function initAfterAuth(){ const gotUid = await ensureAuth(); uid = gotUid; if(playerName && uid){ const remote = await readPlayer(uid); if(remote && remote.cookies){ cookies = Math.max(cookies, remote.cookies); cps = Math.max(cps, remote.cps || 0); } await writePlayer(uid, { name: playerName, cookies: Math.floor(cookies), cps }); } updateUI(); renderShop(); renderOrbit(); renderSkins(); subscribeLeaderboard(); checkGorf(); }

(async function init(){ applySkin(); renderShop(); renderOrbit(); renderSkins(); updateUI(); if(playerName){ nameInput.value = playerName; document.getElementById('playerName').textContent = playerName; hide(playerPanel); show(gamePanel); show(shopPanel); show(skinsPanel); show(leaderPanel); initAfterAuth(); } try{ const authId = await ensureAuth(); uid = authId; subscribeLeaderboard(); }catch(e){ console.warn('auth init failed', e); } setInterval(saveLocalAndRemote, 5000); })();

// helpers: show/hide, resize
function show(el){ if(!el) return; el.classList.remove('hidden'); }
function hide(el){ if(!el) return; el.classList.add('hidden'); }
function resizeCanvas(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
