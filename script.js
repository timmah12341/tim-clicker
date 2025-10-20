// script.js
import { ensureAuth, writePlayer, readPlayersOnce, onPlayers } from './firebase.js';

/* DOM */
const playerPanel = document.getElementById('playerPanel');
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const gamePanel = document.getElementById('gamePanel');
const playerNameLabel = document.getElementById('playerNameLabel');
const timImg = document.getElementById('timImg');
const orbitContainer = document.getElementById('orbitContainer');
const timsEl = document.getElementById('tims');
const cpsEl = document.getElementById('cps');
const openShopBtn = document.getElementById('openShop');
const shopPanel = document.getElementById('shopPanel');
const shopList = document.getElementById('shopList');
const skinsPanel = document.getElementById('skinsPanel');
const skinsList = document.getElementById('skinsList');
const openSkinsBtn = document.getElementById('openSkins');
const minigamePanel = document.getElementById('minigamePanel');
const openMinigamesBtn = document.getElementById('openMinigames');
const playClickRush = document.getElementById('playClickRush');
const minigameArea = document.getElementById('minigameArea');
const leaderboardEl = document.getElementById('leaderboard');
const musicToggle = document.getElementById('musicToggle');
const dailyBtn = document.getElementById('dailyBtn');
const canvas = document.getElementById('bgParticles');
const ctx = canvas.getContext('2d');
let uid = null;

/* state */
let playerName = localStorage.getItem('tim_name') || '';
let tims = Number(localStorage.getItem('tim_tims') || 0);
let cps = Number(localStorage.getItem('tim_cps') || 0);
let owned = JSON.parse(localStorage.getItem('tim_owned') || '[]');
let selectedSkin = localStorage.getItem('tim_skin') || 'cookie.png';

const upgrades = [
  { id: 'u1', name: 'Tim-ema', baseCost: 100, add: 2, icon: 'upgrade1.png' },
  { id: 'u2', name: 'Floatie', baseCost: 500, add: 8, icon: 'upgrade2.png' },
  { id: 'u3', name: ':3', baseCost: 2000, add: 25, icon: 'upgrade3.png' },
  { id: 'u4', name: 'Tim', baseCost: 6000, add: 70, icon: 'upgrade4.png' },
  { id: 'u5', name: 'Depression Upgrade', baseCost: 15000, add: 180, icon: 'upgrade5.png' },
  { id: 'u6', name: 'Ball Guy Tim', baseCost: 40000, add: 450, icon: 'upgrade6.png' },
  { id: 'u7', name: 'gorF', baseCost: 120000, add: 1200, icon: 'upgrade7.png' },
  { id: 'u8', name: 'Tequilla', baseCost: 300000, add: 2500, icon: 'upgrade8.png' }
];

function ownedCount(id){ const o = owned.find(x=>x.id===id); return o? o.count : 0; }
function increaseOwned(id){ let o = owned.find(x=>x.id===id); if(!o) owned.push({id, count:1}); else o.count++; localStorage.setItem('tim_owned', JSON.stringify(owned)); }

function calcCost(base, count){ return Math.max(1, Math.round(base * Math.pow(1.25, count))); }

/* init */
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); window.addEventListener('resize', resize);
if (playerName){ startGameAfterName(); } else { playerPanel.classList.remove('hidden'); gamePanel.classList.add('hidden'); }

saveNameBtn.addEventListener('click', async ()=>{
  const n = nameInput.value.trim(); if(!n) return alert('Enter a name'); playerName = n; localStorage.setItem('tim_name', playerName);
  uid = await ensureAuth(); await writePlayer(uid, { name: playerName, tims, cps }); startGameAfterName();
});

function startGameAfterName(){ playerPanel.classList.add('hidden'); gamePanel.classList.remove('hidden'); playerNameLabel.textContent = playerName; buildShop(); buildSkins(); renderOrbit(); checkDailyOnLoad(); ensureAuth().then(id=>{uid=id; onPlayers(obj=>renderLeaderboard(obj));}); }

timImg.addEventListener('click', ()=>{ tims += 1; spawnClickFx(); playClickTone(); updateUI(); saveLocalAndRemote(); timImg.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:140}); });

openShopBtn.addEventListener('click', ()=> shopPanel.classList.toggle('hidden'));
openSkinsBtn.addEventListener('click', ()=> skinsPanel.classList.toggle('hidden'));
openMinigamesBtn.addEventListener('click', ()=> minigamePanel.classList.toggle('hidden'));

/* shop */
function buildShop(){
  shopList.innerHTML='';
  upgrades.forEach(u=>{
    const cnt = ownedCount(u.id); const cost = calcCost(u.baseCost, cnt);
    const item = document.createElement('div'); item.className='shop-item';
    item.innerHTML = `<div class="meta"><img src="${u.icon}" alt="${u.name}"/><div><div class="u-name">${u.name}</div><div class="u-desc">${u.add} CPS</div></div></div><div class="buy"><div class="cost">${cost} Tims</div><button class="buy-btn">Buy</button></div>`;
    item.querySelector('.buy-btn').addEventListener('click', ()=> buyUpgrade(u.id));
    shopList.appendChild(item);
  });
}

function buyUpgrade(id){
  const u = upgrades.find(x=>x.id===id); const cnt = ownedCount(id); const cost = calcCost(u.baseCost, cnt);
  if (tims < cost){ shopList.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:220}); return; }
  tims -= cost; cps += u.add; increaseOwned(id); buildShop(); renderOrbit(); updateUI(); saveLocalAndRemote();
}

/* orbit */
function renderOrbit(){
  orbitContainer.innerHTML='';
  const items = [];
  owned.forEach(o=>{ const u = upgrades.find(x=>x.id===o.id); if(u) for(let i=0;i<o.count;i++) items.push(u); });
  const radius = 140;
  items.forEach((u,i)=>{
    const angle = (i/items.length) * Math.PI * 2;
    const el = document.createElement('div'); el.className='orbit-item'; el.style.animationDuration = `${8 + (i%5)*0.7}s`;
    const x = Math.cos(angle)*radius; const y = Math.sin(angle)*radius;
    el.style.left = `calc(50% + ${x}px - 28px)`; el.style.top = `calc(50% + ${y}px - 28px)`;
    el.innerHTML = `<img src="${u.icon}" alt="${u.name}" title="${u.name}">`;
    el.addEventListener('click', e=>{ e.stopPropagation(); buyUpgrade(u.id); });
    orbitContainer.appendChild(el);
  });
}

/* skins */
const skins = [ {id:'cookie.png',name:'Default'},{id:'skin_tim.png',name:'Tim-ema'},{id:'skin_galaxy.png',name:'Galaxy'} ];
function buildSkins(){ skinsList.innerHTML=''; skins.forEach(s=>{ const d=document.createElement('div'); d.className='skin'+(selectedSkin===s.id?' selected':''); d.innerHTML=`<img src="${s.id}" alt="${s.name}"><div class="skin-name">${s.name}</div>`; d.addEventListener('click', ()=>{ selectedSkin=s.id; timImg.src=selectedSkin; localStorage.setItem('tim_skin', selectedSkin); buildSkins(); }); skinsList.appendChild(d); }); }

/* minigame - Click Rush */
playClickRush.addEventListener('click', ()=>{
  minigameArea.innerHTML=''; const info=document.createElement('div'); info.innerHTML='<p>Click fast for 10s!</p>';
  const score=document.createElement('div'); score.className='mg-score'; score.textContent='0'; const btn=document.createElement('button'); btn.textContent='Start';
  minigameArea.appendChild(info); minigameArea.appendChild(score); minigameArea.appendChild(btn);
  btn.addEventListener('click', ()=>{ btn.disabled=true; let clicks=0; const clickBtn=document.createElement('button'); clickBtn.textContent='Click!'; minigameArea.appendChild(clickBtn); clickBtn.addEventListener('click', ()=>{ clicks++; score.textContent=clicks; spawnClickFx(); }); setTimeout(()=>{ clickBtn.disabled=true; btn.disabled=false; tims+=clicks; updateUI(); saveLocalAndRemote(); alert('Click Rush ended! +' + clicks + ' Tims'); minigameArea.innerHTML=''; },10000); });
});

/* leaderboard */
function renderLeaderboard(obj){ const arr = Object.values(obj||{}); arr.sort((a,b)=> (b.tims||0) - (a.tims||0)); leaderboardEl.innerHTML=''; arr.slice(0,15).forEach((p,i)=>{ const li = document.createElement('li'); li.textContent = `${i+1}. ${p.name} — ${Math.floor(p.tims||0)} Tims`; leaderboardEl.appendChild(li); }); }

/* CPS tick & save */
setInterval(()=>{ tims += cps; updateUI(); saveLocalAndRemote(); },1000);

/* save/load */
function updateUI(){ timsEl.textContent = Math.floor(tims); cpsEl.textContent = cps; timImg.src = selectedSkin; }
function saveLocal(){ localStorage.setItem('tim_tims', Math.floor(tims)); localStorage.setItem('tim_cps', cps); localStorage.setItem('tim_owned', JSON.stringify(owned)); localStorage.setItem('tim_skin', selectedSkin); }
async function saveLocalAndRemote(){ saveLocal(); if(!uid){ try{ uid = await ensureAuth(); }catch(e){ console.warn(e); return; } } if(uid){ await writePlayer(uid, { name: playerName, tims: Math.floor(tims), cps }); } }

/* particles */
let particles = []; function spawnClickFx(){ const r = timImg.getBoundingClientRect(); const x = r.left + r.width/2; const y = r.top + r.height/2; for(let i=0;i<14;i++){ particles.push({ x,y, vx:(Math.random()-0.5)*6, vy:(Math.random()-1.5)*6, life:40+Math.random()*30, size:2+Math.random()*4, hue:260+Math.random()*40 }); } }
function step(){ ctx.clearRect(0,0,canvas.width,canvas.height); for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy += 0.08; p.life--; ctx.beginPath(); ctx.fillStyle = `hsla(${p.hue},80%,60%, ${Math.max(0, p.life/80)})`; ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); if(p.life<=0) particles.splice(i,1); } requestAnimationFrame(step); } step();

/* audio */
const AudioContextClass = window.AudioContext || window.webkitAudioContext; const audioCtx = new AudioContextClass(); let musicPlaying = false;
function playClickTone(){ try{ const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='square'; o.frequency.value = 1400; g.gain.value = 0.06; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12); o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.12); setTimeout(()=>o.stop(),140); }catch(e){} }
function startMusic(){ if(musicPlaying) return; if(audioCtx.state==='suspended') audioCtx.resume(); musicPlaying=true; const tempo=70; const period = 60/tempo; let next = audioCtx.currentTime; (function schedule(){ const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sine'; o.frequency.setValueAtTime(80, next); g.gain.setValueAtTime(0.6, next); g.gain.exponentialRampToValueAtTime(0.0001, next+0.8); o.connect(g); g.connect(audioCtx.destination); o.start(next); o.stop(next+0.85); next += period; if(musicPlaying) setTimeout(schedule, period*1000); })(); }
function stopMusic(){ musicPlaying=false; }
musicToggle.addEventListener('click', ()=>{ if(!musicPlaying) startMusic(); else stopMusic(); musicToggle.textContent = musicPlaying ? '🔇' : '🔊'; });

/* animated background orbs */
const bg = document.getElementById('bg-animated');
function spawnBgOrbs(){ for(let i=0;i<12;i++){ const el = document.createElement('div'); el.className='orb'; el.style.left = Math.random()*100 + '%'; el.style.top = Math.random()*100 + '%'; el.style.width = (80 + Math.random()*160)+'px'; el.style.height = el.style.width; el.style.opacity = 0.02 + Math.random()*0.08; bg.appendChild(el); setTimeout(()=>el.remove(), 60000); } } spawnBgOrbs();

/* daily reward */
function todayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function checkDailyOnLoad(){ const last = localStorage.getItem('tim_daily'); const today = todayKey(); if(last !== today){ const reward=100; tims += reward; localStorage.setItem('tim_daily', today); updateUI(); saveLocalAndRemote(); setTimeout(()=>alert('Daily reward: +'+reward+' Tims!'),200); } }
dailyBtn.addEventListener('click', ()=>{ const last=localStorage.getItem('tim_daily'); const today=todayKey(); if(last===today) alert('Already claimed today'); else { const reward=100; tims+=reward; localStorage.setItem('tim_daily', today); updateUI(); saveLocalAndRemote(); alert('You claimed '+reward+' Tims!'); } });

/* initial leaderboard load */
(async function(){ try{ const obj = await readPlayersOnce(); renderLeaderboard(obj); }catch(e){console.warn(e);} })();
