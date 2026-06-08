const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

/**
 * 🏠 בדיקה שהשרת חי
 */
app.get("/", (req, res) => {
  res.send("⚽ World Cup AI Server is LIVE");
});

/**
 * 🧠 חיזוי משחק (גנרי לכל שתי קבוצות)
 */
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;

  // דמו חכם (אפשר לשדרג ל-AI אמיתי בהמשך)
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
 * 📅 משחקים אמיתיים (TheSportsDB)
 */
app.get("/matches", async (req, res) => {
  try {
    const fetch = require("node-fetch");

    // תאריך היום (אפשר לשנות ידנית אם אין משחקים)
    const today = new Date().toISOString().split("T")[0];

    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.events) {
      return res.json([]);
    }

    const matches = data.events.map((m) => ({
      home: m.strHomeTeam,
      away: m.strAwayTeam,
      time: m.strTime || "TBD",
      league: m.strLeague || "Football"
    }));

    res.json(matches);

  } catch (err) {
    console.log("Matches error:", err.message);
    res.json([]);
  }
});

/**
 * 🚀 הפעלת השרת
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
