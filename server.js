const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

const API_KEY = process.env.FOOTBALL_API_KEY;

// 🏠 בדיקה
app.get("/", (req, res) => {
  res.send("🏆 World Cup AI LIVE");
});

// 🧪 בדיקת API
app.get("/test-api", async (req, res) => {
  try {
    const response = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": API_KEY }
    });

    const data = await response.json();

    res.json({
      keyExists: !!API_KEY,
      api: data
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ⚽ FALLBACK — משחקי מונדיאל קבועים (כדי שלא יהיה ריק)
const WORLD_CUP_FIXTURES = [
  { home: "Brazil", away: "Argentina", time: "20:00" },
  { home: "France", away: "England", time: "22:00" },
  { home: "Spain", away: "Germany", time: "18:00" },
  { home: "Portugal", away: "Netherlands", time: "21:00" }
];

// 📅 matches עם fallback
app.get("/matches", async (req, res) => {
  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: { "x-apisports-key": API_KEY }
      }
    );

    const data = await response.json();

    const apiMatches = (data.response || []).map(m => ({
      home: m.teams.home.name,
      away: m.teams.away.name,
      time: m.fixture.date
    }));

    // אם אין נתונים → fallback
    if (apiMatches.length === 0) {
      return res.json(WORLD_CUP_FIXTURES);
    }

    res.json(apiMatches);

  } catch (e) {
    res.json(WORLD_CUP_FIXTURES);
  }
});

// 🧠 חיזוי יציב
function predict(home, away) {
  const hash = s => s.split("").reduce((a, b) => a + b.charCodeAt(0), 0);

  const h = hash(home);
  const a = hash(away);

  const total = h + a;

  return {
    homeWin: Number((h / total).toFixed(2)),
    awayWin: Number((a / total).toFixed(2)),
    draw: 0.2,
    expectedScore: `${Math.round((h / total) * 3)}-${Math.round((a / total) * 3)}`
  };
}

app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;
  res.json(predict(home, away));
});

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
