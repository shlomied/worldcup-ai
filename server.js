const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

// 🏟️ קבוצות
const TEAMS = {
  Brazil: { power: 92 },
  Germany: { power: 88 },
  France: { power: 91 },
  Spain: { power: 86 },
  Argentina: { power: 90 },
  England: { power: 87 },
  Portugal: { power: 85 },
  Netherlands: { power: 84 }
};

// 📈 כושר (מערכת חכמה)
let form = {};

// 🧠 win probability חכם
function getWinProb(a, b) {
  const fa = form[a] || 0;
  const fb = form[b] || 0;

  const A = TEAMS[a].power + fa;
  const B = TEAMS[b].power + fb;

  return A / (A + B);
}

// 🔄 עדכון כושר
function updateForm(team, win) {
  if (!form[team]) form[team] = 0;

  form[team] += win ? 2 : -1;

  if (form[team] > 10) form[team] = 10;
  if (form[team] < -5) form[team] = -5;
}

// ⚽ משחק חכם
function match(a, b) {
  const p = getWinProb(a, b);

  const gA = Math.round(Math.random() * 3 * p);
  const gB = Math.round(Math.random() * 3 * (1 - p));

  const winner = gA >= gB ? a : b;

  updateForm(a, winner === a);
  updateForm(b, winner === b);

  return {
    a,
    b,
    winner,
    score: `${gA}-${gB}`,
    probability: p
  };
}

// 🏆 טורניר
let tournament = null;

function runTournament() {
  let teams = Object.keys(TEAMS);

  const result = {
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: [],
    champion: null,
    scorers: {}
  };

  let round = 1;

  while (teams.length > 1) {
    const next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const res = match(a, b);

      next.push(res.winner);

      result.scorers[a] = (result.scorers[a] || 0) + Math.floor(Math.random() * 3);
      result.scorers[b] = (result.scorers[b] || 0) + Math.floor(Math.random() * 2);

      const obj = { ...res };

      if (round === 1) result.roundOf16.push(obj);
      if (round === 2) result.quarterFinal.push(obj);
      if (round === 3) result.semiFinal.push(obj);
      if (round === 4) result.final.push(obj);
    }

    teams = next;
    round++;
  }

  result.champion = teams[0];

  let top = null;
  let goals = 0;

  for (let t in result.scorers) {
    if (result.scorers[t] > goals) {
      goals = result.scorers[t];
      top = t;
    }
  }

  result.topScorer = {
    player: top,
    goals
  };

  return result;
}

function ensure() {
  if (!tournament) tournament = runTournament();
}

// 🏠 health
app.get("/", (req, res) => {
  res.send("WORLD CUP AI ULTIMATE");
});

// 🏆 bracket
app.get("/bracket", (req, res) => {
  ensure();
  res.json(tournament);
});

// ⚽ predict
app.get("/predict/:a/:b", (req, res) => {
  const p = getWinProb(req.params.a, req.params.b);

  res.json({
    homeWin: Number(p.toFixed(2)),
    awayWin: Number((1 - p).toFixed(2)),
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`
  });
});

// 🧠 insight
app.get("/insight/:team", (req, res) => {
  res.json({
    team: req.params.team,
    reasons: [
      "כושר יציב",
      "יכולת התקפית",
      "איזון טקטי"
    ]
  });
});

app.listen(PORT, () => console.log("SERVER RUNNING"));
