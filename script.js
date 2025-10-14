// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8u0P-timclicker-demo-key",
  authDomain: "tim-clicker.firebaseapp.com",
  databaseURL: "https://tim-clicker-default-rtdb.firebaseio.com",
  projectId: "tim-clicker",
  storageBucket: "tim-clicker.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:demo123"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Game variables
let cookies = 0;
let cps = 0;
let username = localStorage.getItem("timclicker_username");
const upgrades = [
  { name: "Cursor", cost: 50, add: 1 },
  { name: "Grandma", cost: 250, add: 5 },
  { name: "Factory", cost: 1000, add: 20 },
  { name: "Portal", cost: 5000, mult: 2 },
  { name: "Time Machine", cost: 15000, mult: 3 }
];

// DOM elements
const cookie = document.getElementById("cookie");
const cookiesDisplay = document.getElementById("cookies");
const cpsDisplay = document.getElementById("cps");
const upgradeList = document.getElementById("upgrade-list");
const leaderboard = document.getElementById("board");
const usernameSection = document.getElementById("username-section");
const usernameInput = document.getElementById("username-input");
const startBtn = document.getElementById("start-btn");
const gameSection = document.getElementById("game");
const upgradeSection = document.getElementById("upgrades");
const leaderboardSection = document.getElementById("leaderboard");

// User setup
if (username) {
  startGame();
} else {
  usernameSection.classList.remove("hidden");
}

startBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (name.length < 2) return alert("Please enter a valid name!");
  username = name;
  localStorage.setItem("timclicker_username", name);
  startGame();
});

function startGame() {
  usernameSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  upgradeSection.classList.remove("hidden");
  leaderboardSection.classList.remove("hidden");
  renderUpgrades();
  loadLeaderboard();
  updateDisplay();
}

// Cookie clicking
cookie.addEventListener("click", () => {
  cookies++;
  updateDisplay();
});

// Game loop
setInterval(() => {
  cookies += cps / 10;
  updateDisplay();
}, 100);

function updateDisplay() {
  cookiesDisplay.textContent = `Cookies: ${Math.floor(cookies)}`;
  cpsDisplay.textContent = `CPS: ${cps}`;
  saveScore();
}

function renderUpgrades() {
  upgradeList.innerHTML = "";
  upgrades.forEach((upg, i) => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.textContent = `${upg.name} - ${upg.cost} cookies`;
    div.onclick = () => buyUpgrade(i);
    upgradeList.appendChild(div);
  });
}

function buyUpgrade(i) {
  const upg = upgrades[i];
  if (cookies >= upg.cost) {
    cookies -= upg.cost;
    upg.cost = Math.floor(upg.cost * 1.5);
    if (upg.add) cps += upg.add;
    if (upg.mult) cps *= upg.mult;
    updateDisplay();
    renderUpgrades();
  }
}

// Firebase leaderboard
function saveScore() {
  if (!username) return;
  set(ref(db, "players/" + username), {
    name: username,
    score: Math.floor(cookies),
  });
}

function loadLeaderboard() {
  onValue(ref(db, "players"), (snapshot) => {
    const data = snapshot.val() || {};
    const players = Object.values(data).sort((a, b) => b.score - a.score);
    leaderboard.innerHTML = "";
    players.slice(0, 10).forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.name}: ${p.score} cookies`;
      leaderboard.appendChild(li);
    });
  });
}
