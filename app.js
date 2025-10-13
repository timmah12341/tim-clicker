import React, { useState, useEffect } from "react";
import "./styles.css";
import cookieImg from "../public/cookie.png";
import upgrade1 from "../public/upgrade1.png";
import upgrade2 from "../public/upgrade2.png";
import upgrade3 from "../public/upgrade3.png";

export default function App() {
  const [cookies, setCookies] = useState(0);
  const [cps, setCps] = useState(0);
  const [upgrades, setUpgrades] = useState([
    { id: 1, name: "Cursor", cost: 50, type: "add", value: 1, icon: upgrade1 },
    { id: 2, name: "Grandma", cost: 250, type: "add", value: 5, icon: upgrade2 },
    { id: 3, name: "Factory", cost: 1000, type: "mult", value: 2, icon: upgrade3 }
  ]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setCookies(c => c + cps), 1000);
    return () => clearInterval(interval);
  }, [cps]);

  const clickCookie = () => setCookies(c => c + 1);

  const buyUpgrade = (upgrade) => {
    if (cookies < upgrade.cost) return alert("Not enough cookies!");
    setCookies(c => c - upgrade.cost);
    if (upgrade.type === "add") setCps(c => c + upgrade.value);
    else if (upgrade.type === "mult") setCps(c => c * upgrade.value);
  };

  const addToLeaderboard = () => {
    const name = prompt("Enter your name:");
    if (!name) return;
    const newBoard = [...leaderboard, { name, cookies }];
    newBoard.sort((a, b) => b.cookies - a.cookies);
    setLeaderboard(newBoard.slice(0, 5));
  };

  return (
    <div className="App">
      <h1>🍪 Tim Clicker 🍪</h1>
      <img
        src={cookieImg}
        alt="cookie"
        className="cookie"
        onClick={clickCookie}
      />
      <h2>Cookies: {cookies}</h2>
      <h3>CPS: {cps}</h3>

      <div className="upgrades">
        {upgrades.map(u => (
          <div key={u.id} className="upgrade" onClick={() => buyUpgrade(u)}>
            <img src={u.icon} alt={u.name} />
            <p>{u.name}</p>
            <p>💰 {u.cost}</p>
          </div>
        ))}
      </div>

      <button onClick={addToLeaderboard}>Save Score 🏆</button>

      <h2>🏆 Leaderboard 🏆</h2>
      <ul>
        {leaderboard.map((player, i) => (
          <li key={i}>
            {i + 1}. {player.name} — {player.cookies} 🍪
          </li>
        ))}
      </ul>
    </div>
  );
}
