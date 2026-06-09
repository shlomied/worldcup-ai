const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

// 🔑 API KEY מ-Render
const API_KEY = process.env.FOOTBALL_API_KEY;

// =========================
// 🏠 בדיקת שרת
// =========================
app.get("/", (req, res) => {
  res.send("🏆 World Cup AI - LIVE");
});

// =========================
// 🧪 בדיקת חיבור API
// =========================
app.get("/test-api", async (req, res) => {
  try {
    const response = await fetch("https://v3.football.api-sports.io/status", {
      headers: {
        "x-apisports-key": API_KEY
      }
    });

    const data = await response.json();

    res.json({
      keyExists: !!API_KEY,
      api: data
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// =========================
// 🏆 ID של מונדיאל (API-Football)
// =========================
// World Cup = league id 1 (בדרך כלל API-Football)
// לפעמים משתנה לפי עונה
const WORLD_CUP_LEAGUE_ID = 1;

// =========================
// 📅 משחקי מונדיאל בלבד
// =========================
app.get("/matches", async (req, res) => {
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=2026`,
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    const matches = (data.response || []).map((m) => ({
      home: m.teams.home.name,
      away: m.teams.away.name,
      date: m.fixture.date,
      stadium: m.fixture.venue?.name || "TBD"
    }));

    res.json(matches);

  } catch (err) {
    res.json([]);
  }
});

// =========================
// 🧠 חיזוי חכם (מבוסס שם בלבד - יציב ולא משתנה כל רענון)
// =========================
function hashTeam(name) {
  return name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
}

function predict(home, away) {
  const h = hashTeam(home);
  const a = hashTeam(away);

  const total = h + a;

  const homeWin = h / total;
  const awayWin = a / total;

  return {
    homeWin: Number(homeWin.toFixed(2)),
    awayWin: Number(awayWin.toFixed(2)),
    expectedScore: `${Math.round(homeWin * 3)}-${Math.round(awayWin * 3)}`
  };
}

// =========================
// ⚽ חיזוי משחק
// =========================
app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;
  res.json(predict(home, away));
});

// =========================
// 👑 מלך שערים (אמיתי - בסיס API עתידי)
// =========================
app.get("/top-scorer", async (req, res) => {
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/players/topscorers?league=${WORLD_CUP_LEAGUE_ID}&season=2026`,
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    const players = (data.response || []).slice(0, 5).map((p) => ({
      name: p.player.name,
      goals: p.statistics[0]?.goals?.total || 0,
      team: p.statistics[0]?.team?.name
    }));

    res.json(players);

  } catch (err) {
    res.json([]);
  }
});

// =========================
// 🚀 הפעלת שרת
// =========================
app.listen(PORT, () => {
  console.log("🏆 World Cup AI running on port " + PORT);
});
