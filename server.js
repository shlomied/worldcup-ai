const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

/**
 * 🏠 בדיקה
 */
app.get("/", (req, res) => {
  res.send("⚽ World Cup AI Server LIVE");
});

/**
 * 🏆 מונדיאל קבוע (Fallback)
 */
const WORLD_CUP = [
  ["Brazil", "Germany"],
  ["France", "Spain"],
  ["Argentina", "England"],
  ["Portugal", "Netherlands"]
];

/**
 * 📅 משחקים
 * אם יש API → משתמש בו
 * אחרת → fallback מונדיאל
 */
app.get("/matches", async (req, res) => {
  try {
    const fetch = require("node-fetch");

    const today = new Date().toISOString().split("T")[0];

    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`;

    const response = await fetch(url);
    const data = await response.json();

    if (data?.events?.length > 0) {
      return res.json(
        data.events.map(m => ({
          home: m.strHomeTeam,
          away: m.strAwayTeam,
          time: m.strTime || "TBD",
          league: m.strLeague || "Football"
        }))
      );
    }

    // fallback מונדיאל
    return res.json(
      WORLD_CUP.map(m => ({
        home: m[0],
        away: m[1],
        time: "TBD",
        league: "World Cup"
      }))
    );

  } catch (err) {
    return res.json(
      WORLD_CUP.map(m => ({
        home: m[0],
        away: m[1],
        time: "TBD",
        league: "World Cup"
      }))
    );
  }
});

/**
 * 🧠 חיזוי
 */
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;

  const homeWin = Math.random() * 0.6 + 0.2;
  const draw = Math.random() * 0.3;
  const awayWin = Math.max(0, 1 - homeWin - draw);

  res.json({
    homeWin: Number(homeWin.toFixed(2)),
    draw: Number(draw.toFixed(2)),
    awayWin: Number(awayWin.toFixed(2)),
    expectedScore: `${Math.floor(homeWin * 3)}-${Math.floor(awayWin * 3)}`,
    confidence: Number((Math.random() * 0.3 + 0.6).toFixed(2))
  });
});

/**
 * 🏆 אלופה (סימולציה חכמה)
 */
app.get("/champion", (req, res) => {

  let teams = ["Brazil", "Germany", "France", "Spain", "Argentina", "England", "Portugal", "Netherlands"];

  while (teams.length > 1) {
    let next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      next.push(Math.random() > 0.5 ? a : b);
    }

    teams = next;
  }

  res.json({
    champion: teams[0]
  });
});

app.listen(PORT, () => {
  console.log("World Cup AI running on " + PORT);
});
