// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('FATAL: set DATABASE_URL in env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized:false } : false });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve static files (images etc.)

// util: generate api key
function genKey(){ return crypto.randomBytes(20).toString('hex'); }

// --- API ---
// register: create player row and return api_key
app.post('/api/register', async (req, res) => {
  try {
    const name = (req.body.name || '').toString().slice(0, 64).trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    // create player with unique api_key
    const api_key = genKey();
    const client = await pool.connect();
    try{
      const q = `
        INSERT INTO players (name, cookies, upgrades, api_key)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, cookies, api_key
      `;
      const initUpgrades = {}; // empty object
      const r = await client.query(q, [name, 0, initUpgrades, api_key]);
      const row = r.rows[0];
      res.json({ player_id: row.id, name: row.name, api_key: row.api_key, cookies: row.cookies });
    }finally{ client.release(); }
  } catch(err){
    console.error('register error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// save (upsert) player's progress
app.post('/api/save', async (req, res) => {
  try {
    const apiKey = req.header('x-api-key');
    if (!apiKey) return res.status(401).json({ error: 'api key required' });

    const { cookies, upgrades, perClick, perSec } = req.body;
    const client = await pool.connect();
    try {
      // find player by api_key
      const find = await client.query('SELECT id FROM players WHERE api_key=$1', [apiKey]);
      if (find.rowCount === 0) return res.status(404).json({ error: 'player not found' });
      const playerId = find.rows[0].id;
      const q = `
        UPDATE players
        SET cookies = $1,
            upgrades = $2,
            per_click = $3,
            per_sec = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, cookies
      `;
      const r = await client.query(q, [cookies || 0, upgrades || {}, perClick || 0, perSec || 0, playerId]);
      res.json({ ok:true, player: r.rows[0] });
    } finally { client.release(); }
  } catch(err){
    console.error('save error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// get leaderboard (top 10)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const q = `SELECT id, name, cookies FROM players ORDER BY cookies DESC NULLS LAST LIMIT 10`;
      const r = await client.query(q);
      res.json(r.rows);
    } finally { client.release(); }
  } catch(err){
    console.error('leaderboard error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// get player data
app.get('/api/player/:id', async (req, res) => {
  try {
    const apiKey = req.header('x-api-key');
    if (!apiKey) return res.status(401).json({ error: 'api key required' });
    const id = parseInt(req.params.id, 10);
    const client = await pool.connect();
    try {
      const r = await client.query('SELECT id, name, cookies, upgrades, per_click, per_sec, api_key FROM players WHERE id=$1', [id]);
      if (r.rowCount===0) return res.status(404).json({ error: 'not found' });
      const row = r.rows[0];
      if (row.api_key !== apiKey) return res.status(403).json({ error: 'forbidden' });
      res.json({
        player_id: row.id,
        name: row.name,
        cookies: row.cookies,
        upgrades: row.upgrades,
        perClick: row.per_click,
        perSec: row.per_sec
      });
    } finally { client.release(); }
  } catch(err){
    console.error('player error', err);
    res.status(500).json({ error: 'server error' });
  }
});

// delete player
app.delete('/api/player/:id', async (req, res) => {
  try {
    const apiKey = req.header('x-api-key');
    if (!apiKey) return res.status(401).json({ error: 'api key required' });
    const id = parseInt(req.params.id, 10);
    const client = await pool.connect();
    try {
      const r = await client.query('SELECT api_key FROM players WHERE id=$1', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
      if (r.rows[0].api_key !== apiKey) return res.status(403).json({ error: 'forbidden' });
      await client.query('DELETE FROM players WHERE id=$1', [id]);
      res.json({ ok:true });
    } finally { client.release(); }
  } catch(err){
    console.error('delete error', err);
    res.status(500).json({ error:'server error' });
  }
});

// health
app.get('/api/health', (req,res)=>res.json({ok:true}));

// start
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
