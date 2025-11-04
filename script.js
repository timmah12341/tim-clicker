// Base data
let tims = 0;
let tps = 0;
let playerName = localStorage.getItem("playerName") || null;
let upgrades = [
  { id: 1, name: "Tim-ema", cost: 10, add: 1, owned: 0 },
  { id: 2, name: "Floatieeee", cost: 50, add: 3, owned: 0 },
  { id: 3, name: ":3", cost: 200, add: 10, owned: 0 },
  { id: 4, name: "Ball Guy Tim", cost: 800, add: 25, owned: 0 },
  { id: 5, name: "Depressie", cost: 2000, add: 100, owned: 0 },
  { id: 6, name: "gorF", cost: 5000, add: 250, owned: 0 },
  { id: 7, name: "Tequilla", cost: 10000, add: 500, owned: 0 },
  { id: 8, name: "Underwater Tim", cost: 20000, add: 1000, owned: 0 },
];

// Elements
const timImage = document.getElementById("timImage");
const timCount = document.getElementById("timCount");
const tpsText = document.getElementById("tps");
const nameInput = document.getElementById("nameInput");
const startBtn = document.getElementById("startBtn");
const loginPanel = document.getElementById("loginPanel");
const gamePanel = document.getElementById("gamePanel");
const shopPanel = document.getElementById("shopPanel");
const playerNameText = document.getElementById("playerName");
const shopList = document.getElementById("shopList");
const orbitContainer = document.getElementById("orbitContainer");

// Music
const bgMusic = new Audio("https://cdn.pixabay.com/download/audio/2023/03/02/audio_6be62d78cc.mp3?filename=lofi-ambient-14269.mp3");
bgMusic.loop = true;
let musicEnabled = false;

document.getElementById("musicToggle").onclick = () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) bgMusic.play(); else bgMusic.pause();
};

// Popup function
function showPopup(title, text) {
  const overlay = document.getElementById("popupOverlay");
  document.getElementById("popupTitle").textContent = title;
  document.getElementById("popupText").textContent = text;
  overlay.classList.remove("hidden");
  document.getElementById("popupClose").onclick = () => overlay.classList.add("hidden");
}

// Start button
startBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) return showPopup("Oops!", "Please enter your name first!");
  localStorage.setItem("playerName", name);
  playerName = name;
  startGame();
};

function startGame() {
  loginPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
  shopPanel.classList.remove("hidden");
  playerNameText.textContent = `Player: ${playerName}`;
  loadShop();
  showPopup("Welcome!", `Hello ${playerName}, start clicking your Tim!`);
}

// Clicking tim
timImage.onclick = () => {
  tims++;
  timCount.textContent = tims;
  createClickEffect();
};

// Click effect
function createClickEffect() {
  const el = document.createElement("div");
  el.textContent = "+1";
  el.className = "clickEffect";
  el.style.left = (50 + Math.random() * 20 - 10) + "%";
  el.style.top = "50%";
  el.style.position = "absolute";
  el.style.color = "#ff99ff";
  el.style.fontWeight = "bold";
  el.style.animation = "floatUp 1s ease forwards";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

const style = document.createElement('style');
style.textContent = `
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-80px); opacity: 0; }
}
`;
document.head.appendChild(style);

// Shop
function loadShop() {
  shopList.innerHTML = "";
  upgrades.forEach(upg => {
    const item = document.createElement("div");
    item.className = "shopItem";
    item.innerHTML = `
      <b>${upg.name}</b><br>
      Cost: ${upg.cost} Tims<br>
      Adds ${upg.add} TPS<br>
      Owned: ${upg.owned}<br>
      <button>Buy</button>
    `;
    item.querySelector("button").onclick = () => buyUpgrade(upg);
    shopList.appendChild(item);
  });
}

function buyUpgrade(upg) {
  if (tims < upg.cost) return showPopup("Not enough Tims!", "Earn more before buying this!");
  tims -= upg.cost;
  upg.owned++;
  tps += upg.add;
  timCount.textContent = tims;
  tpsText.textContent = tps;
  spawnOrbitingTim(upg);
  showPopup("Bought!", `You purchased ${upg.name}!`);
  loadShop();
}

function spawnOrbitingTim(upg) {
  const img = document.createElement("img");
  img.src = "cookie.png";
  img.style.animationDelay = Math.random() * 4 + "s";
  orbitContainer.appendChild(img);
}

// Passive gain loop
setInterval(() => {
  tims += tps;
  timCount.textContent = tims;
}, 1000);

// Auto-login if saved
if (playerName) startGame();
