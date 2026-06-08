const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

const TEAMS = {
  Brazil: { power: 92, star: "Neymar" },
  Germany: { power: 88, star: "Musiala" },
  France: { power: 91, star: "Mbappé" },
  Spain: { power: 86, star: "Yamal" },
  Argentina: { power: 90, star: "Messi" },
  England: { power: 87, star: "Kane" },
  Portugal: { power: 85, star: "Ronaldo" },
  Netherlands: { power: 84, star: "de Jong" }
};

let tournament = null;
let notifications = [
  { id: 1, text: "🔥 משחק גדול מתחיל היום", type: "big" },
  { id: 2, text: "🏆 Brazil פייבוריטית", type: "champion" },
  { id: 3, text: "⚠️ הפתעה אפשרית במשחקים", type: "warning" }
];

/**
 * ⚽ משחק
 */
function match(a, b) {
  const A = TEAMS[a].power;
  const B = TEAMS[b].power;

  const p = A / (A + B);

  const gA = Math.round(Math.random() * 3 * p);
  const gB = Math.round(Math.random() * 3 * (1 - p));

  return {
    winner: gA >= gB ? a : b,
    gA,
    gB
  };
}

/**
 * 🏆 טורניר מלא
 */
function runTournament() {
  let teams = Object.keys(TEAMS);
  let scorers = {};

  const rounds = {
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: [],
    champion: null
  };

  let round = 1;

  while (teams.length > 1) {
    let next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const res = match(a, b);

      next.push(res.winner);

      scorers[a] = (scorers[a] || 0) + res.gA;
      scorers[b] = (scorers[b] || 0) + res.gB;

      const obj = {
        a,
        b,
        winner: res.winner,
        score: `${res.gA}-${res.gB}`
      };

      if (round === 1) rounds.roundOf16.push(obj);
      if (round === 2) rounds.quarterFinal.push(obj);
      if (round === 3) rounds.semiFinal.push(obj);
      if (round === 4) rounds.final.push(obj);
    }

    teams = next;
    round++;
  }

  rounds.champion = teams[0];

  let best = null;
  let goals = 0;

  for (let t in scorers) {
    if (scorers[t] > goals) {
      goals = scorers[t];
      best = t;
    }
  }

  return {
    ...rounds,
    topScorer: {
      player: TEAMS[best]?.star || best,
      goals
    }
  };
}

function ensure() {
  if (!tournament) tournament = runTournament();
}

/**
 * 🏠 health
 */
app.get("/", (req, res) => {
  res.send("WORLD CUP AI LIVE");
});

/**
 * ⚽ matches
 */
app.get("/matches", (req, res) => {
  const list = Object.keys(TEAMS);
  const matches = [];

  for (let i = 0; i < list.length; i += 2) {
    matches.push({ home: list[i], away: list[i + 1] });
  }

  res.json(matches);
});

/**
 * 🧠 predict
 */
app.get("/predict/:a/:b", (req, res) => {
  const A = TEAMS[req.params.a].power;
  const B = TEAMS[req.params.b].power;

  const p = A / (A + B);

  res.json({
    homeWin: Number(p.toFixed(2)),
    awayWin: Number((1 - p).toFixed(2)),
    draw: 0.15,
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`
  });
});

/**
 * 🧠 insight
 */
app.get("/insight/:team", (req, res) => {
  const t = req.params.team;

  res.json({
    team: t,
    winChance: (TEAMS[t]?.power || 80) / 100,
    reasons: ["כושר גבוה", "סגל חזק", "ניסיון בינלאומי"]
  });
});

/**
 * 🏆 bracket
 */
app.get("/bracket", (req, res) => {
  ensure();
  res.json(tournament);
});

/**
 * 👑 top scorer
 */
app.get("/top-scorer", (req, res) => {
  ensure();
  res.json(tournament.topScorer);
});

/**
 * 🔔 notifications
 */
app.get("/notifications", (req, res) => {
  res.json(notifications);
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING");
});
