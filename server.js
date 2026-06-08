const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

/**
 * 🏆 נבחרות + כוח
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
 * 📊 מצב שמור (חשוב!)
 */
let tournamentResult = null;

/**
 * ⚽ סימולציית משחק
 */
function playMatch(a, b) {
  const aPower = TEAMS[a];
  const bPower = TEAMS[b];

  const aChance = aPower / (aPower + bPower);

  const goalsA = Math.round(Math.random() * 3 * aChance);
  const goalsB = Math.round(Math.random() * 3 * (1 - aChance));

  const winner = goalsA >= goalsB ? a : b;

  return { winner, goalsA, goalsB };
}

/**
 * 🏆 סימולציית טורניר מלאה (פעם אחת!)
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

      // 👑 שערים למלך שערים
      scorers[match.winner] = (scorers[match.winner] || 0) + match.goalsA;
      scorers[b] = (scorers[b] || 0) + match.goalsB;
    }

    teams = next;
  }

  const champion = teams[0];

  // 👑 מלך שערים
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
 * 🚀 יצירת טורניר פעם אחת בלבד
 */
function ensureTournament() {
  if (!tournamentResult) {
    tournamentResult = runTournament();
  }
}

/**
 * 🏠 אלופה (קבועה!)
 */
app.get("/champion", (req, res) => {
  ensureTournament();
  res.json({ champion: tournamentResult.champion });
});

/**
 * 👑 מלך שערים
 */
app.get("/top-scorer", (req, res) => {
  ensureTournament();
  res.json({
    player: tournamentResult.topScorer,
    goals: tournamentResult.scorers[tournamentResult.topScorer]
  });
});

/**
 * ⚽ חיזוי פר משחק (עדיין דינמי)
 */
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;

  const homePower = TEAMS[home] || 80;
  const awayPower = TEAMS[away] || 80;

  const homeWin = homePower / (homePower + awayPower);
  const awayWin = 1 - homeWin;

  res.json({
    homeWin,
    awayWin,
    draw: 0.15,
    expectedScore: `${Math.round(homeWin * 3)}-${Math.round(awayWin * 3)}`,
    confidence: 0.75
  });
});

/**
 * 📅 משחקים
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

app.listen(PORT, () => {
  console.log("World Cup AI stable running on " + PORT);
});
