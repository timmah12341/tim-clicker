// script.js v2.1 modified - DB saving + Stack the Johans minigame
import { ensureAuth, writePlayer, readPlayersOnce, readPlayer, onPlayers } from './firebase.js';

/* DOM refs */
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
const openSkinsBtn = document.getElementById('openSkins');
const minigamePanel = document.getElementById('minigamePanel');
const playClickRush = document.getElementById('playClickRush');
const playTimJump = document.getElementById('playTimJump');
const playStack = document.getElementById('playStack');
const minigameArea = document.getElementById('minigameArea');
const leaderboardEl = document.getElementById('leaderboard');
const musicToggle = document.getElementById('musicToggle');
const dailyBtn = document.getElementById('dailyBtn');
const siteTitle = document.getElementById('siteTitle');

/* stack overlay refs */
const stackOverlay = document.getElementById('stackOverlay');
const stackArea = document.getElementById('stackArea');
const stackTimerEl = document.getElementById('stackTimer');
const stackCountEl = document.getElementById('stackCount');
const stackCancel = document.getElementById('stackCancel');

/* state */
let uid = null;
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
  { id: 'u7', name: 'Johan', baseCost: 120000, add: 1200, icon: 'upgrade7.png' },
  { id: 'u8', name: 'Tequilla', baseCost: 400000, add: 10000, icon: 'upgrade8.png' }
];

function ownedCount(id){ const o = owned.find(x=>x.id===id); return o? o.count : 0; }
function increaseOwned(id){ let o = owned.find(x=>x.id===id); if(!o) owned.push({id, count:1}); else o.count++; localStorage.setItem('tim_owned', JSON.stringify(owned)); }

function calcCost(base, count){ return Math.max(1, Math.round(base * Math.pow(1.25, count))); }
function formatNumber(n){ return n.toLocaleString(); }

/* UI init */
if (playerName){ initAfterName(); } else { playerPanel.classList.remove('hidden'); gamePanel.classList.add('hidden'); }

saveNameBtn.addEventListener('click', async ()=>{
  const n = nameInput.value.trim(); if(!n) return alert('Enter a name'); playerName = n; localStorage.setItem('tim_name', playerName);
  uid = await ensureAuth().catch(()=>null); // create or sync
  // try to read existing player by uid; if empty, write initial
  if(uid){
    const remote = await readPlayer(uid).catch(()=>null);
    if (remote){
      // merge remote and local (take higher values)
      tims = Math.max(tims, remote.tims || 0);
      cps = Math.max(cps, remote.cps || 0);
      owned = remote.owned || owned;
      selectedSkin = remote.skin || selectedSkin;
    }
    await writePlayer(uid, { name: playerName, tims, cps, owned, skin: selectedSkin, lastDaily: localStorage.getItem('tim_daily')||null }).catch(()=>{});
  }
  initAfterName();
});

async function initAfterName(){
  playerPanel.classList.add('hidden'); gamePanel.classList.remove('hidden');
  playerNameLabel.textContent = playerName;
  timImg.src = selectedSkin;
  buildShop(); renderOrbit(); buildLeaderboardInitial();
  // listen for leaderboard updates
  try{ uid = await ensureAuth(); onPlayers(obj=>renderLeaderboard(obj)); }catch(e){ console.warn(e); }
  checkDailyOnLoad();
  renderJohanBadge();
}

/* clicking tim */
timImg.addEventListener('click', ()=>{
  tims += 1; spawnClickFx(); playClickTone(); updateUI(); saveLocalAndRemote();
  timImg.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:140});
});

/* shop toggles and building */
openShopBtn && openShopBtn.addEventListener('click', ()=> shopPanel.classList.toggle('hidden'));

function buildShop(){
  if(!shopList) return;
  shopList.innerHTML = '';
  upgrades.forEach(u=>{
    const cnt = ownedCount(u.id);
    const cost = calcCost(u.baseCost, cnt);
    const item = document.createElement('div'); item.className='shop-item';
    item.innerHTML = `<div class="meta"><img src="${u.icon}" alt="${u.name}"/><div><div class="u-name">${u.name}</div><div class="u-desc">${u.add} CPS</div></div></div><div class="buy"><div class="cost">${formatNumber(cost)} Tims</div><button class="buy-btn">Buy</button></div>`;
    item.querySelector('.buy-btn').addEventListener('click', ()=> buyUpgrade(u.id));
    shopList.appendChild(item);
  });
}

function buyUpgrade(id){
  const u = upgrades.find(x=>x.id===id);
  const cnt = ownedCount(id);
  const cost = calcCost(u.baseCost, cnt);
  if (tims < cost){ shopList && shopList.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:220}); return; }
  tims -= cost; cps += u.add; increaseOwned(id); buildShop(); renderOrbit(); updateUI(); saveLocalAndRemote();
  if(id === 'u7') renderJohanBadge();
}

/* orbit rendering (layers) */
function renderOrbit(){
  orbitContainer.innerHTML = '';
  const layers = upgrades.length;
  const center = {x: orbitContainer.clientWidth/2 || 160, y: orbitContainer.clientHeight/2 || 160};
  const baseRadius = 70;
  const step = 26;
  upgrades.forEach((u, layerIdx)=>{
    const cnt = ownedCount(u.id);
    if(cnt <= 0) return;
    const radius = baseRadius + layerIdx * step;
    const icons = Math.min(6, cnt);
    for(let i=0;i<icons;i++){
      const angle = (i/icons) * Math.PI*2;
      const el = document.createElement('div'); el.className='orbit-item';
      el.style.width = '30px'; el.style.height = '30px';
      el.style.left = `calc(50% + ${Math.cos(angle)*radius}px - 15px)`;
      el.style.top = `calc(50% + ${Math.sin(angle)*radius}px - 15px)`;
      el.style.pointerEvents = 'none';
      const img = document.createElement('img'); img.src = u.icon; img.alt = u.name; img.style.width='100%'; img.style.height='100%'; img.style.borderRadius='6px';
      el.appendChild(img);
      el.style.animation = `layer-rotate ${10 + layerIdx*1.6}s linear infinite`;
      orbitContainer.appendChild(el);
    }
  });
}

/* ensure CSS keyframes */
(function ensureLayerKeyframes(){ if(document.getElementById('orbit-css')) return; const s=document.createElement('style'); s.id='orbit-css'; s.textContent='@keyframes layer-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}'; document.head.appendChild(s); })();

/* skins */
const skins = [ {id:'cookie.png',name:'Default'},{id:'skin_tim.png',name:'Tim-ema'},{id:'skin_galaxy.png',name:'Galaxy'} ];
function buildSkins(){ if(!document.getElementById('skinsList')) return; const panel = document.getElementById('skinsList'); panel.innerHTML=''; skins.forEach(s=>{ const el=document.createElement('div'); el.className='skin-entry'; el.innerHTML=`<img src="${s.id}" width="48" height="48"><div>${s.name}</div><button>Select</button>`; el.querySelector('button').addEventListener('click', ()=>{ selectedSkin = s.id; timImg.src = selectedSkin; saveLocalAndRemote(); }); panel.appendChild(el); }); }

/* minigames: Click Rush simplified and Stack the Johans draggable stacking */
playClickRush && playClickRush.addEventListener('click', ()=>{
  minigameArea.innerHTML = '';
  const info = document.createElement('div'); info.innerHTML = '<p>Click fast for 10s!</p>';
  const score = document.createElement('div'); score.className = 'mg-score'; score.textContent='0';
  const btn = document.createElement('button'); btn.textContent = 'Start';
  minigameArea.appendChild(info); minigameArea.appendChild(score); minigameArea.appendChild(btn);
  btn.addEventListener('click', ()=>{
    btn.disabled = true; let clicks=0;
    const clickBtn = document.createElement('button'); clickBtn.textContent='Click!'; minigameArea.appendChild(clickBtn);
    clickBtn.addEventListener('click', ()=>{ clicks++; score.textContent = clicks; spawnClickFx(); });
    setTimeout(()=>{ clickBtn.disabled = true; btn.disabled = false; tims += clicks; updateUI(); saveLocalAndRemote(); alert('Click Rush ended! +' + clicks + ' Tims'); minigameArea.innerHTML=''; }, 10000);
  });
});

// Stack the Johans UI triggers
playStack && playStack.addEventListener('click', ()=>{
  document.getElementById('minigamePanel').classList.remove('hidden');
  document.getElementById('playStackBtn').classList.remove('hidden');
});
document.getElementById('playStackBtn').addEventListener('click', startStackMinigame);

/* Stack minigame implementation - drag to stack 6 Johans in 10s */
let stacking = false;
let placed = 0;
let stackPieces = [];
let stackTimer = null;
function startStackMinigame(){
  stacking = true; placed = 0; stackPieces = [];
  stackOverlay.classList.remove('hidden'); stackArea.innerHTML='';
  stackTimerEl.textContent = '10'; stackCountEl.textContent = '0';
  // create base (invisible) at center bottom to stack on
  const base = document.createElement('div'); base.className='stack-base'; stackArea.appendChild(base);
  // spawn 6 draggable Johans one by one at top area
  for(let i=0;i<6;i++){
    const j = document.createElement('div'); j.className='stack-johan'; j.draggable = false;
    // initial position
    j.style.left = (20 + i*60) + 'px'; j.style.top = '20px';
    stackArea.appendChild(j);
    makeDraggable(j);
    stackPieces.push(j);
  }
  // timer countdown 10s
  let timeLeft = 10;
  stackTimer = setInterval(()=>{
    timeLeft--; stackTimerEl.textContent = timeLeft;
    if(timeLeft <= 0){ endStackMinigame(false); }
  }, 1000);
  stackCancel.onclick = ()=> endStackMinigame(false);
}

function makeDraggable(el){
  let offsetX=0, offsetY=0, dragging=false;
  function onDown(e){
    e.preventDefault();
    dragging = true;
    el.style.cursor = 'grabbing';
    const rect = el.getBoundingClientRect();
    offsetX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    offsetY = (e.touches ? e.touches[0].clientY : e.touches[0].clientY) - rect.top;
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove); document.addEventListener('touchend', onUp);
  }
  function onMove(e){
    if(!dragging) return;
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    const parentRect = stackArea.getBoundingClientRect();
    let x = clientX - parentRect.left - offsetX;
    let y = clientY - parentRect.top - offsetY;
    // clamp within area
    x = Math.max(0, Math.min(parentRect.width - el.offsetWidth, x));
    y = Math.max(0, Math.min(parentRect.height - el.offsetHeight, y));
    el.style.left = x + 'px'; el.style.top = y + 'px';
  }
  function onUp(e){
    if(!dragging) return;
    dragging = false; el.style.cursor = 'grab';
    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp);
    // check collision with top of stack (or base)
    const parentRect = stackArea.getBoundingClientRect();
    const baseRect = stackArea.querySelector('.stack-base').getBoundingClientRect();
    // determine current top Y coordinate from placed pieces
    let topY = baseRect.top;
    const placedEls = Array.from(stackArea.querySelectorAll('.stack-johan.placed'));
    if(placedEls.length > 0){
      const last = placedEls[placedEls.length-1];
      topY = last.getBoundingClientRect().top;
    }
    const elRect = el.getBoundingClientRect();
    const centerX = baseRect.left + baseRect.width/2;
    const elCenterX = elRect.left + elRect.width/2;
    const dx = Math.abs(centerX - elCenterX);
    const toleranceX = baseRect.width * 1.2;
    const pieceHeight = elRect.height;
    const targetTop = (placedEls.length>0 ? (placedEls[placedEls.length-1].getBoundingClientRect().top - pieceHeight + 6) : (baseRect.top - pieceHeight + 6));
    const dy = Math.abs(elRect.top - targetTop);
    if(dx <= toleranceX && dy <= 40){
      // snap into place
      const localTop = (targetTop - stackArea.getBoundingClientRect().top);
      const localLeft = (centerX - stackArea.getBoundingClientRect().left - elRect.width/2);
      el.style.left = localLeft + 'px'; el.style.top = localTop + 'px';
      el.classList.add('placed');
      placed++;
      stackCountEl.textContent = placed;
      if(placed >= 6){
        endStackMinigame(true);
      }
    } else {
      endStackMinigame(false);
    }
  }
  el.addEventListener('mousedown', onDown);
  el.addEventListener('touchstart', onDown, {passive:false});
}

/* end stack minigame */
let activeBoost = null;
function endStackMinigame(success){
  stacking = false;
  clearInterval(stackTimer); stackTimer = null;
  stackOverlay.classList.add('hidden');
  stackArea.innerHTML = '';
  if(success){
    const duration = 600; // 10 minutes
    applyTemporaryBoost(2, duration);
    alert('Success! 2x CPS for 10 minutes. Multiple wins extend duration.');
  } else {
    alert('Failed to stack the Johans.');
  }
  saveLocalAndRemote();
}

/* apply boost */
function applyTemporaryBoost(mult, seconds){
  if(activeBoost && activeBoost.timeoutId){
    activeBoost.remaining = (activeBoost.remaining || 0) + seconds;
    clearTimeout(activeBoost.timeoutId);
    activeBoost.timeoutId = setTimeout(()=>{ removeBoost(activeBoost.mult); activeBoost = null; }, activeBoost.remaining*1000);
    return;
  }
  activeBoost = { mult, remaining: seconds, timeoutId: null };
  cps = Math.floor(cps * mult);
  activeBoost.timeoutId = setTimeout(()=>{ removeBoost(mult); activeBoost = null; }, seconds*1000);
  updateUI(); saveLocalAndRemote();
}
function removeBoost(mult){
  cps = Math.max(0, Math.floor(cps / mult));
  updateUI(); saveLocalAndRemote();
}

/* leaderboard */
function renderLeaderboard(obj){
  const arr = Object.values(obj || {});
  arr.sort((a,b)=> (b.tims || 0) - (a.tims || 0));
  leaderboardEl.innerHTML = '';
  arr.slice(0,15).forEach((p,i)=>{ const li=document.createElement('li'); li.textContent = `${i+1}. ${p.name} — ${Math.floor(p.tims||0)} Tims`; leaderboardEl.appendChild(li); });
}
async function buildLeaderboardInitial(){ try{ const obj = await readPlayersOnce(); renderLeaderboard(obj); }catch(e){ console.warn(e); } }

/* main loop */
setInterval(()=>{ tims += cps; updateUI(); saveLocalAndRemote(); }, 1000);

/* persistence: DB primary, local holds only small things for convenience */
function updateUI(){ timsEl.textContent = formatNumber(Math.floor(tims)); cpsEl.textContent = cps; timImg.src = selectedSkin; renderJohanBadge(); }
function saveLocal(){ localStorage.setItem('tim_name', playerName); }
async function saveLocalAndRemote(){ saveLocal(); if(!uid){ try{ uid = await ensureAuth(); }catch(e){ console.warn(e); return; } } if(uid){ try{ await writePlayer(uid, { name: playerName, tims: Math.floor(tims), cps, owned, skin: selectedSkin, lastDaily: localStorage.getItem('tim_daily')||null }); }catch(e){ console.warn(e); } } }

/* particles */
function spawnClickFx(){ if(!timImg) return; const r = timImg.getBoundingClientRect(); const x = r.left + r.width/2; const y = r.top + r.height/2; /* minimal visual via tiny floating element */ const p = document.createElement('div'); p.textContent = '+1'; p.style.position='fixed'; p.style.left = (x-10)+'px'; p.style.top = (y-10)+'px'; p.style.color='#ffd6ff'; p.style.fontWeight='800'; p.style.pointerEvents='none'; document.body.appendChild(p); p.animate([{transform:'translateY(0)', opacity:1},{transform:'translateY(-80px)', opacity:0}], {duration:900}).onfinish = ()=> p.remove(); }

/* audio stub */
function playClickTone(){}

musicToggle && musicToggle.addEventListener('click', ()=>{ /* simple mute toggle placeholder */ alert('Music toggle (stub)'); });

/* Johan badge: single badge on playerNameLabel */
function renderJohanBadge(){
  if(!playerNameLabel) return;
  let existing = playerNameLabel.querySelector('.johan-badge');
  const hasJohan = ownedCount('u7') > 0;
  if(hasJohan && !existing){
    existing = document.createElement('img');
    existing.className = 'johan-badge';
    existing.src = 'upgrade7.png';
    existing.alt = 'Johan';
    existing.title = 'Johan';
    playerNameLabel.appendChild(existing);
  } else if(!hasJohan && existing){
    existing.remove();
  }
}

/* secret triple-click */
let titleClicks = 0;
siteTitle && siteTitle.addEventListener('click', ()=>{ titleClicks++; setTimeout(()=>{ titleClicks=0; },800); if(titleClicks>=3){ titleClicks=0; tims+=500; updateUI(); saveLocalAndRemote(); alert('Secret +500 Tims!'); } });

/* init */
buildSkins();
updateUI();
buildShop();
renderOrbit();
