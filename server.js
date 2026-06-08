const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

/**
 * 🏠 בדיקה שהשרת חי
 */
app.get("/", (req, res) => {
  res.send("⚽ World Cup AI - ELO Edition is LIVE");
});

/**
 * 🏆 נבחרות מונדיאל
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
 * 📅 משחקים (מונדיאל קבוע)
 */
const WORLD_CUP = [
  ["Brazil", "Germany"],
  ["France", "Spain"],
  ["Argentina", "England"],
  ["Portugal", "Netherlands"]
];

app.get("/matches", (req, res) => {
  res.json(
    WORLD_CUP.map(m => ({
      home: m[0],
      away: m[1]
    }))
  );
});

/**
 * 🧠 מנוע ELO חכם
 */
function calcProb(homeRating, awayRating) {
  return homeRating / (homeRating + awayRating);
}

/**
 * ⚽ חיזוי משחק (ELO אמיתי)
 */
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;

  const homeRating = TEAMS[home] || 80;
  const awayRating = TEAMS[away] || 80;

  const homeWin = calcProb(homeRating, awayRating);
  const awayWin = 1 - homeWin;

  const draw = 0.15;

  const expectedScore =
    `${Math.round(homeWin * 3)}-${Math.round(awayWin * 3)}`;

  const confidence = 0.6 + Math.random() * 0.3;

  res.json({
    homeWin: Number(homeWin.toFixed(2)),
    draw: Number(draw.toFixed(2)),
    awayWin: Number(awayWin.toFixed(2)),
    expectedScore,
    confidence: Number(confidence.toFixed(2))
  });
});

/**
 * 🏆 סימולציית אלופה (מבוסס כוח)
 */
app.get("/champion", (req, res) => {

  let teams = Object.keys(TEAMS);

  while (teams.length > 1) {

    let next = [];

    for (let i = 0; i < teams.length; i += 2) {

      const a = teams[i];
      const b = teams[i + 1];

      const aPower = TEAMS[a];
      const bPower = TEAMS[b];

      const aWinChance = aPower / (aPower + bPower);

      if (Math.random() < aWinChance) {
        next.push(a);
      } else {
        next.push(b);
      }
    }

    teams = next;
  }

  res.json({
    champion: teams[0]
  });
});

/**
 * 🚀 הפעלת שרת
 */
app.listen(PORT, () => {
  console.log("World Cup AI ELO Server running on port " + PORT);
});
