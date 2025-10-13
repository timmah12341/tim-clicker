let cookies = 0;
let cps = 0;

const cookieElem = document.getElementById("cookie");
const cookiesElem = document.getElementById("cookies");
const cpsElem = document.getElementById("cps");
const upgradesElem = document.getElementById("upgrades");

const upgrades = [
  { name: "Cursor", cost: 50, type: "add", value: 1, icon: "upgrade1.png" },
  { name: "Grandma", cost: 250, type: "add", value: 5, icon: "upgrade2.png" },
  { name: "Factory", cost: 1000, type: "mult", value: 2, icon: "upgrade3.png" },
];

function updateDisplay() {
  cookiesElem.textContent = `Cookies: ${Math.floor(cookies)}`;
  cpsElem.textContent = `CPS: ${cps}`;
}

cookieElem.addEventListener("click", () => {
  cookies += 1;
  updateDisplay();
});

function createUpgrade(upgrade) {
  const div = document.createElement("div");
  div.className = "upgrade";
  div.innerHTML = `
    <img src="${upgrade.icon}" alt="${upgrade.name}" />
    <h4>${upgrade.name}</h4>
    <p>Cost: ${upgrade.cost}</p>
  `;
  div.addEventListener("click", () => buyUpgrade(upgrade));
  upgradesElem.appendChild(div);
}

function buyUpgrade(upgrade) {
  if (cookies >= upgrade.cost) {
    cookies -= upgrade.cost;
    if (upgrade.type === "add") cps += upgrade.value;
    else if (upgrade.type === "mult") cps *= upgrade.value;
    upgrade.cost = Math.floor(upgrade.cost * 1.5);
    updateDisplay();
  } else {
    alert("Not enough cookies!");
  }
}

upgrades.forEach(createUpgrade);

setInterval(() => {
  cookies += cps / 10;
  updateDisplay();
}, 100);
