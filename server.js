const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

// 🏟️ דאטה קבועה (לא משתנה = יציבות)
const TEAMS = {
  Brazil: ["Neymar", "Vinicius"],
  Germany: ["Musiala", "Kimmich"],
  France: ["Mbappé", "Griezmann"],
  Spain: ["Yamal", "Pedri"],
  Argentina: ["Messi", "Alvarez"],
  England: ["Kane", "Saka"],
  Portugal: ["Ronaldo", "Leao"],
  Netherlands: ["de Jong", "Gakpo"]
};

const POWER = {
  Brazil: 92,
  Germany: 88,
  France: 91,
  Spain: 86,
  Argentina: 90,
  England: 87,
  Portugal: 85,
  Netherlands: 84
};

// 📦 מצב קבוע של טורניר (לא נבנה מחדש כל פעם)
let STATE = null;

// 📊 סטטיסטיקה
let goals = {};
let form = {};

// 🎲 חיזוי יציב + שונות אמיתית
function probability(a, b) {
  const baseA = POWER[a] + (form[a] || 0);
  const baseB = POWER[b] + (form[b] || 0);

  const noise = (Math.random() - 0.5) * 4;

  return (baseA + noise) / (baseA + baseB + Math.abs(noise));
}

// ⚽ גול לשחקן
function addGoal(team) {
  const players = TEAMS[team];
  const scorer = players[Math.floor(Math.random() * players.length)];

  goals[scorer] = (goals[scorer] || 0) + 1;
}

// ⚽ משחק
function play(a, b) {

  const p = probability(a, b);

  const gA = Math.round(Math.random() * 3 * p);
  const gB = Math.round(Math.random() * 3 * (1 - p));

  const winner = gA >= gB ? a : b;

  form[a] = (form[a] || 0) + (winner === a ? 2 : -1);
  form[b] = (form[b] || 0) + (winner === b ? 2 : -1);

  for (let i = 0; i < gA; i++) addGoal(a);
  for (let i = 0; i < gB; i++) addGoal(b);

  return { a, b, winner, score: `${gA}-${gB}`, probability: p };
}

// 🏆 בניית טורניר אחת בלבד (קבוע לכל החיים של השרת)
function build() {

  let teams = Object.keys(TEAMS);

  const r = {
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

      const res = play(a, b);

      next.push(res.winner);

      const obj = { ...res };

      if (round === 1) r.roundOf16.push(obj);
      if (round === 2) r.quarterFinal.push(obj);
      if (round === 3) r.semiFinal.push(obj);
      if (round === 4) r.final.push(obj);
    }

    teams = next;
    round++;
  }

  r.champion = teams[0];

  // 👑 מלך שערים (שחקן בלבד)
  let top = null;
  let max = 0;

  for (let p in goals) {
    if (goals[p] > max) {
      max = goals[p];
      top = p;
    }
  }

  r.topScorer = { player: top, goals: max };

  return r;
}

// 🧠 init פעם אחת בלבד
function init() {
  if (!STATE) STATE = build();
}

// 🏠 API
app.get("/", (req, res) => res.send("FINAL MODE ACTIVE"));

app.get("/bracket", (req, res) => {
  init();
  res.json(STATE);
});

app.get("/predict/:a/:b", (req, res) => {
  const a = req.params.a;
  const b = req.params.b;

  const p = probability(a, b);

  res.json({
    homeWin: Number(p.toFixed(2)),
    awayWin: Number((1 - p).toFixed(2)),
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`
  });
});

app.listen(PORT, () => console.log("FINAL MODE RUNNING"));
