// Tim Clicker with Timu Spin (no multiplayer), localStorage-based
(() => {
  // DOM
  const nameInput = document.getElementById('nameInput');
  const startBtn = document.getElementById('startBtn');
  const loginPanel = document.getElementById('loginPanel');
  const gamePanel = document.getElementById('gamePanel');
  const playerNameEl = document.getElementById('playerName');
  const timsEl = document.getElementById('tims');
  const cpsEl = document.getElementById('cps');
  const timImg = document.getElementById('timImg');
  const orbitContainer = document.getElementById('orbitContainer');
  const openShop = document.getElementById('openShop');
  const shopPanel = document.getElementById('shopPanel');
  const shopList = document.getElementById('shopList');
  const leaderboardEl = document.getElementById('leaderboard');

  // spin modal
  const spinModal = document.getElementById('spinModal');
  const spinBtn = document.getElementById('spinBtn');
  const closeSpin = document.getElementById('closeSpin');
  const spinCostEl = document.getElementById('spinCost');
  const buyGoldenBtn = document.getElementById('buyGoldenBtn');
  const wheelCanvas = document.getElementById('wheelCanvas');
  const ctx = wheelCanvas.getContext('2d');

  // popup
  const popup = document.getElementById('popup');
  const popupText = document.getElementById('popupText');
  const popupOk = document.getElementById('popupOk');

  function showPopup(msg){ popupText.textContent = msg; popup.classList.remove('hidden'); }
  popupOk.onclick = ()=> popup.classList.add('hidden');

  // state
  let playerName = localStorage.getItem('tc_name') || '';
  let tims = Number(localStorage.getItem('tc_tims') || 0);
  let cps = Number(localStorage.getItem('tc_cps') || 0);
  let owned = JSON.parse(localStorage.getItem('tc_owned') || '[]'); // array of {id,count}
  let goldenSkin = localStorage.getItem('tc_golden') === '1';
  let spinCost = 100;
  const upgrades = [
    {id:'u1', name:'Tim-ema', baseCost:50, add:1, icon:'cookie.png'},
    {id:'u2', name:'Floatieeee', baseCost:200, add:5, icon:'cookie.png'},
    {id:'u3', name:':3', baseCost:800, add:20, icon:'cookie.png'}
  ];

  function saveLocal(){ localStorage.setItem('tc_name', playerName); localStorage.setItem('tc_tims', tims); localStorage.setItem('tc_cps', cps); localStorage.setItem('tc_owned', JSON.stringify(owned)); localStorage.setItem('tc_golden', goldenSkin ? '1' : '0'); }
  function format(n){ return Math.floor(n).toLocaleString(); }

  // init UI
  function updateUI(){
    playerNameEl.textContent = playerName || 'Player';
    timsEl.textContent = format(tims);
    cpsEl.textContent = format(cps);
    renderShop();
    renderOrbit();
    renderLeaderboard();
    spinCostEl.textContent = spinCost;
  }

  // start game
  startBtn.addEventListener('click', () => {
    const n = nameInput.value.trim();
    if(!n) return showPopup('Enter a name first.');
    playerName = n;
    loginPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
    saveLocal();
    updateUI();
  });

  if(playerName) {
    // auto-start view
    loginPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
    updateUI();
  }

  // click tim
  timImg.addEventListener('click', () => {
    tims += 1;
    spawnClickFx();
    updateUI();
    saveLocal();
  });

  // shop toggle
  openShop.addEventListener('click', () => shopPanel.classList.toggle('hidden'));

  function renderShop(){
    shopList.innerHTML = '';
    upgrades.forEach(u=>{
      const cnt = (owned.find(o=>o.id===u.id)||{count:0}).count || 0;
      const cost = Math.max(1, Math.round(u.baseCost * Math.pow(1.25, cnt)));
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `<div><strong>${u.name}</strong><div>${u.add} CPS</div></div><div><div>${cost} Tims</div><button class="buyBtn">Buy</button></div>`;
      row.querySelector('.buyBtn').addEventListener('click', ()=> {
        if(tims < cost) return showPopup('Not enough Tims');
        tims -= cost;
        cps += u.add * (goldenSkin ? 2 : 1);
        const existing = owned.find(o=>o.id===u.id);
        if(existing) existing.count++; else owned.push({id:u.id,count:1});
        saveLocal(); updateUI();
        showPopup('Purchased ' + u.name);
      });
      shopList.appendChild(row);
    });
  }

  function renderOrbit(){
    orbitContainer.innerHTML = '';
    const items = [];
    owned.forEach(o=>{
      const u = upgrades.find(x=> x.id===o.id);
      if(u) for(let i=0;i<o.count;i++) items.push(u);
    });
    if(items.length===0) return;
    const radius = 120;
    items.forEach((u,i)=>{
      const ang = (i/items.length)*Math.PI*2;
      const el = document.createElement('div');
      el.className = 'orbit-item';
      el.style.left = `calc(50% + ${Math.cos(ang)*radius}px - 28px)`;
      el.style.top = `calc(50% + ${Math.sin(ang)*radius}px - 28px)`;
      el.style.animationDuration = `${6 + (i%5)*0.6}s`;
      el.innerHTML = `<img src="${u.icon}" alt="${u.name}">`;
      orbitContainer.appendChild(el);
    });
  }

  // leaderboard local (one score per device)
  function renderLeaderboard(){
    const val = Number(localStorage.getItem('tc_best') || 0);
    const ol = leaderboardEl;
    ol.innerHTML = `<li>${playerName || 'You'} — ${format(val)} Tims (best)</li><li>Current — ${format(tims)}</li>`;
  }
  function updateBest(){
    const best = Number(localStorage.getItem('tc_best') || 0);
    if(tims > best) localStorage.setItem('tc_best', Math.floor(tims));
  }

  // passive CPS
  setInterval(()=> {
    let gain = cps;
    tims += gain;
    updateUI();
    saveLocal();
    updateBest();
  }, 1000);

  // click FX
  function spawnClickFx(){
    const p = document.createElement('div');
    p.textContent = '+1';
    p.style.position='absolute';
    p.style.left = (50 + (Math.random()*20-10)) + '%';
    p.style.top = (50 + (Math.random()*20-10)) + '%';
    p.style.color = '#ffd6ff';
    p.style.fontWeight = '800';
    p.style.pointerEvents = 'none';
    document.body.appendChild(p);
    p.animate([{transform:'translateY(0)', opacity:1},{transform:'translateY(-80px)', opacity:0}], {duration:900}).onfinish = ()=> p.remove();
  }

  // Timu Spin implementation
  const sectors = [
    {name:'+100 Tims', type:'tims', value:100},
    {name:'+300 Tims', type:'tims', value:300},
    {name:'+800 Tims', type:'tims', value:800},
    {name:'2x CPS 30s', type:'boost', value:2, duration:30},
    {name:'5x CPS 20s', type:'boost', value:5, duration:20},
    {name:'10x CPS 10s', type:'boost', value:10, duration:10},
    {name:'Golden Skin (free)', type:'golden', value:1},
    {name:'+50 Tims', type:'tims', value:50}
  ];

  function drawWheel(){
    const w = wheelCanvas.width, h = wheelCanvas.height, cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 8;
    const seg = sectors.length;
    for(let i=0;i<seg;i++){
      const a0 = (i/seg)*Math.PI*2, a1 = ((i+1)/seg)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,a0,a1);
      ctx.closePath();
      ctx.fillStyle = i%2? '#3b0069' : '#22002f';
      ctx.fill();
      // label
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate((a0+a1)/2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd6ff';
      ctx.font = '16px sans-serif';
      ctx.fillText(sectors[i].name, r-12, 6);
      ctx.restore();
    }
    // center circle
    ctx.beginPath(); ctx.arc(cx,cy,40,0,Math.PI*2); ctx.fillStyle='#170021'; ctx.fill();
    ctx.fillStyle='#ffd6ff'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center'; ctx.fillText('SPIN',cx,cy+6);
  }
  drawWheel();

  // spin logic
  let spinning = false;
  spinBtn.addEventListener('click', () => {
    if(spinning) return;
    if(tims < spinCost) return showPopup('Not enough Tims to spin.');
    tims -= spinCost; updateUI(); saveLocal();
    spinning = true;
    // pick random sector with weights
    const weights = [20,14,8,10,6,2,1,39];
    const total = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*total, idx=0;
    for(let i=0;i<weights.length;i++){ r -= weights[i]; if(r<=0){ idx=i; break; } }
    // animate wheel rotation to land on idx
    const spins = 6;
    const seg = sectors.length;
    const targetAngle = (1 - (idx + 0.5)/seg) * Math.PI*2;
    const duration = 4000;
    const start = performance.now();
    const startAngle = 0;
    const easeOut = t => 1 - Math.pow(1-t,3);
    function frame(now){
      const t = (now-start)/duration;
      const eased = easeOut(Math.min(1,t));
      const angle = startAngle + (spins*Math.PI*2 + targetAngle) * eased;
      // draw rotated
      ctx.clearRect(0,0,w,h);
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle); ctx.translate(-cx,-cy);
      drawWheel();
      ctx.restore();
      if(t<1) requestAnimationFrame(frame); else {
        spinning=false;
        const prize = sectors[idx];
        applyPrize(prize);
      }
    }
    requestAnimationFrame(frame);
  });

  function applyPrize(prize){
    if(prize.type === 'tims'){
      tims += prize.value;
      showPopup('You won ' + prize.value + ' Tims!');
      updateUI(); saveLocal(); updateBest();
    } else if(prize.type === 'boost'){
      showPopup('You won ' + prize.value + 'x CPS for ' + prize.duration + 's!');
      applyTemporaryBoost(prize.value, prize.duration);
    } else if(prize.type === 'golden'){
      if(goldenSkin){ showPopup('You already have the Golden Tim. +200 Tims!'); tims += 200; }
      else { goldenSkin = true; showPopup('Golden Tim unlocked! CPS will be multiplied by 2 when buying upgrades.'); }
      saveLocal(); updateUI(); updateBest();
    }
  }

  // temporary boost logic
  let activeBoost = null;
  function applyTemporaryBoost(mult, seconds){
    if(activeBoost && activeBoost.timeoutId){
      clearTimeout(activeBoost.timeoutId);
      cps = Math.floor(cps / activeBoost.mult);
    }
    cps = Math.floor(cps * mult);
    activeBoost = { mult, timeoutId: setTimeout(()=> {
      cps = Math.max(0, Math.floor(cps / mult));
      activeBoost = null;
      updateUI(); saveLocal();
    }, seconds*1000) };
    updateUI(); saveLocal();
  }

  // buy golden directly (cost 500)
  buyGoldenBtn.addEventListener('click', ()=> {
    if(goldenSkin) return showPopup('You already own Golden Tim.');
    if(tims < 500) return showPopup('Not enough Tims to buy Golden Tim (500).');
    tims -= 500; goldenSkin = true; saveLocal(); updateUI();
    showPopup('Golden Tim purchased! CPS upgrade multiplier active.');
  });

  closeSpin.addEventListener('click', ()=> spinModal.classList.add('hidden'));
  document.getElementById('openSpin').addEventListener('click', ()=> {
    spinModal.classList.remove('hidden');
    drawWheel();
  });

  // orbit items render already handled in renderOrbit()

  // utility: update best
  function updateBest(){ const best = Number(localStorage.getItem('tc_best')||0); if(tims>best) localStorage.setItem('tc_best', Math.floor(tims)); renderLeaderboard(); }

  // initial UI update
  updateUI();

})();
