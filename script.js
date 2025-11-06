let tims = 0;
let cpsMultiplier = 1;

document.getElementById("clickTim").addEventListener("click", () => {
  tims += 1 * cpsMultiplier;
  updateCount();
});

document.getElementById("buyGoldenTim").addEventListener("click", () => {
  if (tims >= 500) {
    tims -= 500;
    cpsMultiplier *= 1.5;
    alert("Golden Tim purchased! CPS boosted by 1.5x!");
    updateCount();
  } else {
    alert("Not enough tims!");
  }
});

function updateCount() {
  document.getElementById("count").textContent = tims.toFixed(0);
}

// Timu Spin
const openBtn = document.getElementById("openTimuSpin");
const spinModal = document.getElementById("timuSpinModal");
const closeBtn = document.getElementById("closeSpin");
const spinBtn = document.getElementById("spinButton");
const result = document.getElementById("spinResult");

openBtn.addEventListener("click", () => {
  spinModal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  spinModal.classList.add("hidden");
});

spinBtn.addEventListener("click", () => {
  const outcomes = [
    "💸 You won 100 tims!",
    "🍀 You won 50 tims!",
    "😢 You lost 25 tims!",
    "🔥 JACKPOT! +500 tims!",
    "💤 Nothing happened...",
  ];
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
  result.textContent = outcome;

  if (outcome.includes("won 100")) tims += 100;
  else if (outcome.includes("won 50")) tims += 50;
  else if (outcome.includes("lost 25")) tims = Math.max(0, tims - 25);
  else if (outcome.includes("JACKPOT")) tims += 500;
  updateCount();
});
