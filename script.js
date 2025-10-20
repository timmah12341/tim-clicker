import { db } from "./firebase.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const nameScreen = document.getElementById("nameScreen");
const gameScreen = document.getElementById("gameScreen");
const nameInput = document.getElementById("playerName");
const nameButton = document.getElementById("startGame");
const cookieBtn = document.getElementById("cookie");
const cookieCount = document.getElementById("cookieCount");
const cpsDisplay = document.getElementById("cps");
const upgradesContainer = document.getElementById("upgrades");
const leaderboardList = document.getElementById("leaderboard");

let cookies = 0;
let cps = 0;
let username = localStorage.getItem("timclicker_name");
let upgrades = [
  { id: 1, name: "Tim-ema", cost: 50, cps: 1 },
  { id: 2, name: "Floatie", cost: 150, cps: 3 },
  { id: 3, name: ":3", cost: 400, cps: 5 },
  { id: 4, name: "Tim", cost: 1000, cps: 10 },
  { id: 5, name: "Alexander", cost: 2500, cps: 25 },
  { id: 6, name: "Depression Upgrade", cost: 5000, cps: 50 },
  { id: 7, name: "Ball Guy Tim", cost: 10000, cps: 100 },
  { id: 8, name: "gorF", cost: 20000, cps: 200 }
];

// show name screen if user not saved
if (!username) {
  nameScreen.style.display = "flex";
} else {
  startGame(username);
}

// handle name input
nameButton.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Enter a name first!");
  username = name;
  localStorage.setItem("timclicker_name", name);

  // create player in Firebase if not exists
  await set(ref(db, "players/" + name), {
    name: name,
    cookies: 0
  });

  startGame(name);
});

function startGame(name) {
  nameScreen.style.display = "none";
  gameScreen.style.display = "block";
  loadLeaderboard();
  updateDisplay();
  createUpgradeButtons();
  startCookieLoop();
}

// clicking cookie
cookieBtn.addEventListener("click", () => {
  cookies++;
  updateDisplay();
});

// create upgrades
function createUpgradeButtons() {
  upgradesContainer.innerHTML = "";
  upgrades.forEach((u) => {
    const btn = document.createElement("button");
    btn.className = "upgrade";
    btn.innerHTML = `${u.name}<br>$${u.cost}`;
    btn.addEventListener("click", () => buyUpgrade(u));
    upgradesContainer.appendChild(btn);
  });
}

function buyUpgrade(upg) {
  if (cookies >= upg.cost) {
    cookies -= upg.cost;
    cps += upg.cps;
    upg.cost = Math.round(upg.cost * 1.5);
    updateDisplay();
    createUpgradeButtons();
  }
}

function startCookieLoop() {
  setInterval(() => {
    cookies += cps;
    updateDisplay();
    savePlayer();
  }, 1000);
}

function updateDisplay() {
  cookieCount.innerText = cookies;
  cpsDisplay.innerText = cps;
}

async function savePlayer() {
  if (!username) return;
  await set(ref(db, "players/" + username), {
    name: username,
    cookies: cookies
  });
  loadLeaderboard();
}

async function loadLeaderboard() {
  const snapshot = await get(child(ref(db), "players"));
  if (snapshot.exists()) {
    const data = snapshot.val();
    const sorted = Object.values(data).sort((a, b) => b.cookies - a.cookies);
    leaderboardList.innerHTML = sorted
      .map((p, i) => `<li>#${i + 1} ${p.name}: ${p.cookies}</li>`)
      .join("");
  }
}
