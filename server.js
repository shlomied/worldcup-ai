const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

// 🏟️ FIFA TEAMS + PLAYERS
const TEAMS = {
  Brazil: { power: 92, players: ["Neymar", "Vinicius"] },
  Germany: { power: 88, players: ["Musiala", "Kimmich"] },
  France: { power: 91, players: ["Mbappé", "Griezmann"] },
  Spain: { power: 86, players: ["Yamal", "Pedri"] },
  Argentina: { power: 90, players: ["Messi", "Alvarez"] },
  England: { power: 87, players: ["Kane", "Saka"] },
  Portugal: { power: 85, players: ["Ronaldo", "Leao"] },
  Netherlands: { power: 84, players: ["de Jong", "Gakpo"] }
};

// 📊 ELO / FORM / GOALS
let form = {};
let playerGoals = {};

// 🎲 חיזוי חכם (לא קבוע!)
function getProb(a, b) {
  const fa = form[a] || 0;
  const fb = form[b] || 0;

  const A = TEAMS[a].power + fa;
  const B = TEAMS[b].power + fb;

  const noise = (Math.random() - 0.5) * 5; // חשוב מאוד לשונות אמיתית

  return (A + noise) / ((A + B) + Math.abs(noise));
}

// ⚽ גול לשחקן אמיתי
function goal(team) {
  const players = TEAMS[team].players;
  const scorer = players[Math.floor(Math.random() * players.length)];

  playerGoals[scorer] = (playerGoals[scorer] || 0) + 1;
}

// ⚽ משחק אמיתי
function match(a, b) {

  const p = getProb(a, b);

  const gA = Math.round(Math.random() * 3 * p);
  const gB = Math.round(Math.random() * 3 * (1 - p));

  const winner = gA >= gB ? a : b;

  // 📈 form משתנה לפי תוצאה
  form[a] = (form[a] || 0) + (winner === a ? 2 : -1);
  form[b] = (form[b] || 0) + (winner === b ? 2 : -1);

  form[a] = Math.max(-5, Math.min(10, form[a]));
  form[b] = Math.max(-5, Math.min(10, form[b]));

  // ⚽ שערים
  for (let i = 0; i < gA; i++) goal(a);
  for (let i = 0; i < gB; i++) goal(b);

  return {
    a,
    b,
    winner,
    score: `${gA}-${gB}`,
    probability: Number(p.toFixed(2))
  };
}

// 🏆 טורניר (נשמר קבוע)
let tournament = null;

function runTournament() {

  let teams = Object.keys(TEAMS);

  const t = {
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: [],
    champion: null
  };

  let round = 1;

  while (teams.length > 1) {
    const next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const r = match(a, b);

      next.push(r.winner);

      const obj = { ...r };

      if (round === 1) t.roundOf16.push(obj);
      if (round === 2) t.quarterFinal.push(obj);
      if (round === 3) t.semiFinal.push(obj);
      if (round === 4) t.final.push(obj);
    }

    teams = next;
    round++;
  }

  t.champion = teams[0];

  // 👑 מלך שערים אמיתי (שחקן)
  let top = null;
  let max = 0;

  for (let p in playerGoals) {
    if (playerGoals[p] > max) {
      max = playerGoals[p];
      top = p;
    }
  }

  t.topScorer = {
    player: top,
    goals: max
  };

  return t;
}

function ensure() {
  if (!tournament) tournament = runTournament();
}

// 🏠 health
app.get("/", (req, res) => {
  res.send("FIFA MODE SERVER LIVE");
});

// 🏆 bracket
app.get("/bracket", (req, res) => {
  ensure();
  res.json(tournament);
});

// ⚽ חיזוי
app.get("/predict/:a/:b", (req, res) => {
  const p = getProb(req.params.a, req.params.b);

  res.json({
    homeWin: p,
    awayWin: 1 - p,
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`
  });
});

app.listen(PORT, () => console.log("FIFA MODE RUNNING"));
