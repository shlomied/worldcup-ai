const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

const TEAMS = {
  Brazil: 92,
  Germany: 88,
  France: 91,
  Spain: 86,
  Argentina: 90,
  England: 87,
  Portugal: 85,
  Netherlands: 84
};

let tournament = null;

/**
 * ⚽ משחק
 */
function match(a, b) {
  const aP = TEAMS[a];
  const bP = TEAMS[b];

  const aChance = aP / (aP + bP);

  const goalsA = Math.round(Math.random() * 3 * aChance);
  const goalsB = Math.round(Math.random() * 3 * (1 - aChance));

  return {
    winner: goalsA >= goalsB ? a : b,
    goalsA,
    goalsB
  };
}

/**
 * 🏆 טורניר מלא
 */
function runTournament() {
  let teams = Object.keys(TEAMS);
  let scorers = {};

  while (teams.length > 1) {
    let next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const res = match(a, b);

      next.push(res.winner);

      scorers[a] = (scorers[a] || 0) + res.goalsA;
      scorers[b] = (scorers[b] || 0) + res.goalsB;
    }

    teams = next;
  }

  return {
    champion: teams[0],
    scorers
  };
}

function ensure() {
  if (!tournament) tournament = runTournament();
}

/**
 * 🏠 health
 */
app.get("/", (req, res) => {
  res.send("WORLD CUP AI V3 LIVE");
});

/**
 * ⚽ matches
 */
app.get("/matches", (req, res) => {
  res.json([
    ["Brazil", "Germany"],
    ["France", "Spain"],
    ["Argentina", "England"],
    ["Portugal", "Netherlands"]
  ].map(m => ({
    home: m[0],
    away: m[1]
  })));
});

/**
 * 🧠 predict
 */
app.get("/predict/:h/:a", (req, res) => {
  const h = TEAMS[req.params.h] || 80;
  const a = TEAMS[req.params.a] || 80;

  const p = h / (h + a);

  res.json({
    homeWin: Number(p.toFixed(2)),
    awayWin: Number((1 - p).toFixed(2)),
    draw: 0.15,
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`,
    confidence: 0.75
  });
});

/**
 * 🏆 champion
 */
app.get("/champion", (req, res) => {
  ensure();
  res.json({ champion: tournament.champion });
});

/**
 * 👑 top scorer
 */
app.get("/top-scorer", (req, res) => {
  ensure();

  const s = tournament.scorers;

  let best = "";
  let g = 0;

  for (let k in s) {
    if (s[k] > g) {
      g = s[k];
      best = k;
    }
  }

  res.json({ player: best, goals: g });
});

/**
 * 🧠 AI insight (למה ינצחו)
 */
app.get("/insight/:team", (req, res) => {
  const t = req.params.team;
  const p = TEAMS[t] || 80;

  const reasons = [
    "התקפה חזקה",
    "הגנה יציבה",
    "ניסיון בטורנירים גדולים",
    "כושר משחק גבוה",
    "מאזן ניצחונות טוב"
  ];

  res.json({
    team: t,
    power: p,
    winChance: Number((p / 100).toFixed(2)),
    reasons: reasons.sort(() => 0.5 - Math.random()).slice(0, 3)
  });
});

app.listen(PORT, () => console.log("V3 LIVE"));
