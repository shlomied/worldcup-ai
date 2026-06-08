const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

/**
 * 🏆 נבחרות
 */
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

/**
 * 📊 מצב טורניר שמור (לא משתנה כל רענון)
 */
let tournament = null;

/**
 * ⚽ חישוב משחק
 */
function playMatch(a, b) {
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
 * 🏆 סימולציה מלאה (פעם אחת בלבד)
 */
function runTournament() {
  let teams = Object.keys(TEAMS);
  let scorers = {};

  while (teams.length > 1) {
    let next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const match = playMatch(a, b);

      next.push(match.winner);

      scorers[a] = (scorers[a] || 0) + match.goalsA;
      scorers[b] = (scorers[b] || 0) + match.goalsB;
    }

    teams = next;
  }

  const champion = teams[0];

  let topScorer = Object.keys(scorers).reduce((a, b) =>
    scorers[a] > scorers[b] ? a : b
  );

  return {
    champion,
    topScorer,
    scorers
  };
}

/**
 * 🔒 יצירת טורניר יציב
 */
function ensureTournament() {
  if (!tournament) {
    tournament = runTournament();
  }
}

/**
 * 🏠 בדיקה
 */
app.get("/", (req, res) => {
  res.send("⚽ World Cup AI V2 is LIVE");
});

/**
 * ⚽ משחקים
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
 * 🧠 חיזוי
 */
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;

  const homeP = TEAMS[home] || 80;
  const awayP = TEAMS[away] || 80;

  const homeWin = homeP / (homeP + awayP);

  res.json({
    homeWin: Number(homeWin.toFixed(2)),
    awayWin: Number((1 - homeWin).toFixed(2)),
    draw: 0.15,
    expectedScore: `${Math.round(homeWin * 3)}-${Math.round((1 - homeWin) * 3)}`,
    confidence: 0.75
  });
});

/**
 * 🏆 אלופה (יציבה)
 */
app.get("/champion", (req, res) => {
  ensureTournament();
  res.json({ champion: tournament.champion });
});

/**
 * 👑 מלך שערים (יציב)
 */
app.get("/top-scorer", (req, res) => {
  ensureTournament();

  const scorers = tournament.scorers;

  let best = null;
  let goals = 0;

  for (let t in scorers) {
    if (scorers[t] > goals) {
      best = t;
      goals = scorers[t];
    }
  }

  res.json({
    player: best,
    goals
  });
});

/**
 * 🚀 הפעלה
 */
app.listen(PORT, () => {
  console.log("World Cup AI V2 running on port " + PORT);
});
