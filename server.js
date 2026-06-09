const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

// 🔑 API KEY מ-Render (לא לכתוב בקוד!)
const API_KEY = process.env.FOOTBALL_API_KEY;

// 🌍 בדיקת שרת
app.get("/", (req, res) => {
  res.send("⚽ World Cup AI LIVE SERVER");
});

// 🧪 בדיקת חיבור ל-API-Football
app.get("/test-api", async (req, res) => {
  try {
    const response = await fetch("https://v3.football.api-sports.io/status", {
      headers: {
        "x-apisports-key": API_KEY
      }
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.json({ error: err.message });
  }
});

// 📅 משחקים אמיתיים (כרגע בסיס — אפשר לשפר לליגה/מונדיאל)
app.get("/matches", async (req, res) => {
  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    const matches = (data.response || []).slice(0, 10).map((m) => ({
      home: m.teams.home.name,
      away: m.teams.away.name,
      time: m.fixture.date
    }));

    res.json(matches);

  } catch (err) {
    res.json([]);
  }
});

// 🧠 חיזוי פשוט אבל יציב (לא רנדום קיצוני)
function predict(home, away) {

  const hash = (str) =>
    str.split("").reduce((a, b) => a + b.charCodeAt(0), 0);

  const h = hash(home);
  const a = hash(away);

  const base = h / (h + a);

  return {
    homeWin: Number(base.toFixed(2)),
    awayWin: Number((1 - base).toFixed(2)),
    expectedScore: `${Math.round(base * 3)}-${Math.round((1 - base) * 3)}`
  };
}

// ⚽ חיזוי משחק
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;
  res.json(predict(home, away));
});

// 🏆 מלך שערים (placeholder אמיתי עתידי)
app.get("/top-scorer", (req, res) => {
  res.json({
    player: "Loading from API...",
    goals: 0
  });
});

// 🚀 הפעלה
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
