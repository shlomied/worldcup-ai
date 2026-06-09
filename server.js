const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.FOOTBALL_API_KEY;

// =========================
// 🧠 DATA LAYER — DEMO + FUTURE API READY
// =========================

const WORLD_CUP_MATCHES = [
  { home: "Brazil", away: "Argentina", time: "2026-06-11T20:00:00Z", league: "World Cup" },
  { home: "France", away: "England", time: "2026-06-12T22:00:00Z", league: "World Cup" },
  { home: "Spain", away: "Germany", time: "2026-06-13T18:00:00Z", league: "World Cup" },
  { home: "Portugal", away: "Netherlands", time: "2026-06-14T21:00:00Z", league: "World Cup" }
];

const TEAMS = {
  Brazil: {
    he: "ברזיל",
    fifaRank: 5,
    elo: 92,
    attack: 95,
    defense: 84,
    midfield: 88,
    form: 91,
    experience: 94,
    injuries: 8,
    squadDepth: 94,
    starPower: 93,
    recent: ["W", "W", "D", "W", "W"],
    keyPlayers: ["Vinicius Jr", "Rodrygo", "Alisson"]
  },
  Argentina: {
    he: "ארגנטינה",
    fifaRank: 1,
    elo: 94,
    attack: 90,
    defense: 86,
    midfield: 90,
    form: 88,
    experience: 95,
    injuries: 10,
    squadDepth: 88,
    starPower: 91,
    recent: ["W", "D", "W", "W", "L"],
    keyPlayers: ["Lionel Messi", "Lautaro Martínez", "Emiliano Martínez"]
  },
  France: {
    he: "צרפת",
    fifaRank: 2,
    elo: 96,
    attack: 96,
    defense: 89,
    midfield: 91,
    form: 94,
    experience: 92,
    injuries: 6,
    squadDepth: 96,
    starPower: 96,
    recent: ["W", "W", "W", "D", "W"],
    keyPlayers: ["Kylian Mbappé", "Antoine Griezmann", "Tchouaméni"]
  },
  England: {
    he: "אנגליה",
    fifaRank: 4,
    elo: 91,
    attack: 90,
    defense: 84,
    midfield: 92,
    form: 86,
    experience: 84,
    injuries: 9,
    squadDepth: 91,
    starPower: 90,
    recent: ["W", "W", "D", "L", "W"],
    keyPlayers: ["Harry Kane", "Jude Bellingham", "Phil Foden"]
  },
  Spain: {
    he: "ספרד",
    fifaRank: 3,
    elo: 93,
    attack: 87,
    defense: 87,
    midfield: 95,
    form: 90,
    experience: 86,
    injuries: 7,
    squadDepth: 90,
    starPower: 88,
    recent: ["D", "W", "W", "W", "D"],
    keyPlayers: ["Lamine Yamal", "Pedri", "Rodri"]
  },
  Germany: {
    he: "גרמניה",
    fifaRank: 9,
    elo: 89,
    attack: 88,
    defense: 82,
    midfield: 90,
    form: 84,
    experience: 88,
    injuries: 11,
    squadDepth: 88,
    starPower: 87,
    recent: ["L", "W", "D", "W", "W"],
    keyPlayers: ["Jamal Musiala", "Florian Wirtz", "Joshua Kimmich"]
  },
  Portugal: {
    he: "פורטוגל",
    fifaRank: 6,
    elo: 90,
    attack: 91,
    defense: 83,
    midfield: 88,
    form: 87,
    experience: 89,
    injuries: 9,
    squadDepth: 89,
    starPower: 90,
    recent: ["W", "W", "L", "W", "D"],
    keyPlayers: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva"]
  },
  Netherlands: {
    he: "הולנד",
    fifaRank: 7,
    elo: 88,
    attack: 84,
    defense: 88,
    midfield: 86,
    form: 85,
    experience: 86,
    injuries: 8,
    squadDepth: 86,
    starPower: 85,
    recent: ["D", "W", "W", "L", "W"],
    keyPlayers: ["Virgil van Dijk", "Cody Gakpo", "Frenkie de Jong"]
  }
};

const PLAYER_POOL = [
  {
    name: "Kylian Mbappé",
    team: "France",
    goals: 0,
    predictedGoals: 6,
    image: "https://media.api-sports.io/football/players/278.png",
    impact: 94
  },
  {
    name: "Harry Kane",
    team: "England",
    goals: 0,
    predictedGoals: 5,
    image: "https://media.api-sports.io/football/players/184.png",
    impact: 90
  },
  {
    name: "Vinicius Jr",
    team: "Brazil",
    goals: 0,
    predictedGoals: 5,
    image: "https://media.api-sports.io/football/players/762.png",
    impact: 91
  },
  {
    name: "Lionel Messi",
    team: "Argentina",
    goals: 0,
    predictedGoals: 4,
    image: "https://media.api-sports.io/football/players/154.png",
    impact: 90
  },
  {
    name: "Lautaro Martínez",
    team: "Argentina",
    goals: 0,
    predictedGoals: 4,
    image: "https://media.api-sports.io/football/players/162.png",
    impact: 84
  }
];

// =========================
// 🧮 AI SCORE ENGINE
// =========================

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round2(n) {
  return Number(n.toFixed(2));
}

function teamPower(teamName) {
  const t = TEAMS[teamName];

  if (!t) {
    return {
      score: 70,
      breakdown: {
        elo: 70,
        attack: 70,
        defense: 70,
        midfield: 70,
        form: 70,
        experience: 70,
        squadDepth: 70,
        starPower: 70,
        injuryPenalty: 5
      }
    };
  }

  const injuryPenalty = t.injuries;

  const score =
    t.elo * 0.22 +
    t.attack * 0.16 +
    t.defense * 0.13 +
    t.midfield * 0.14 +
    t.form * 0.15 +
    t.experience * 0.08 +
    t.squadDepth * 0.07 +
    t.starPower * 0.08 -
    injuryPenalty * 0.04;

  return {
    score: round2(clamp(score, 0, 100)),
    breakdown: {
      elo: t.elo,
      attack: t.attack,
      defense: t.defense,
      midfield: t.midfield,
      form: t.form,
      experience: t.experience,
      squadDepth: t.squadDepth,
      starPower: t.starPower,
      injuryPenalty
    }
  };
}

function predictMatch(home, away) {
  const homeData = teamPower(home);
  const awayData = teamPower(away);

  const h = homeData.score;
  const a = awayData.score;

  const diff = h - a;

  let draw = 0.21 - Math.min(Math.abs(diff) * 0.003, 0.08);
  draw = clamp(draw, 0.12, 0.24);

  const remaining = 1 - draw;
  const homeRaw = h / (h + a);
  const awayRaw = a / (h + a);

  const homeWin = remaining * homeRaw;
  const awayWin = remaining * awayRaw;

  const homeGoals = clamp(Math.round((homeWin * 3.6) + (h - 80) / 25), 0, 4);
  const awayGoals = clamp(Math.round((awayWin * 3.6) + (a - 80) / 25), 0, 4);

  const favorite = homeWin > awayWin ? home : away;
  const underdog = homeWin > awayWin ? away : home;

  return {
    home,
    away,
    homeWin: round2(homeWin),
    draw: round2(draw),
    awayWin: round2(awayWin),
    expectedScore: `${homeGoals}-${awayGoals}`,
    favorite,
    underdog,
    confidence: round2(Math.max(homeWin, awayWin)),
    power: {
      [home]: homeData,
      [away]: awayData
    },
    explanation: buildExplanation(home, away, homeData, awayData, favorite)
  };
}

function buildExplanation(home, away, homeData, awayData, favorite) {
  const homeScore = homeData.score;
  const awayScore = awayData.score;
  const stronger = favorite;
  const weaker = stronger === home ? away : home;
  const strongerData = stronger === home ? homeData.breakdown : awayData.breakdown;
  const weakerData = stronger === home ? awayData.breakdown : homeData.breakdown;

  const reasons = [];

  if (strongerData.attack > weakerData.attack) {
    reasons.push(`${stronger} עדיפה בהתקפה`);
  }

  if (strongerData.midfield > weakerData.midfield) {
    reasons.push(`${stronger} חזקה יותר בקישור`);
  }

  if (strongerData.form > weakerData.form) {
    reasons.push(`${stronger} מגיעה בכושר טוב יותר`);
  }

  if (strongerData.starPower > weakerData.starPower) {
    reasons.push(`${stronger} נהנית מיותר שחקני הכרעה`);
  }

  if (reasons.length === 0) {
    reasons.push("המשחק מאוזן מאוד לפי מדדי הכוח");
  }

  return {
    summary: `${stronger} מקבלת יתרון קל מול ${weaker} לפי ציון כוח ${Math.max(homeScore, awayScore)} מול ${Math.min(homeScore, awayScore)}.`,
    reasons
  };
}

function simulateChampion() {
  let teams = Object.keys(TEAMS);

  while (teams.length > 1) {
    const next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const p = predictMatch(a, b);
      next.push(p.homeWin >= p.awayWin ? a : b);
    }

    teams = next;
  }

  const champion = teams[0];

  return {
    champion,
    team: TEAMS[champion],
    power: teamPower(champion),
    probability: 0.31
  };
}

// =========================
// 🌍 FUTURE REAL API WRAPPER
// =========================

async function apiFootballStatus() {
  if (!API_KEY) {
    return {
      keyExists: false,
      active: false,
      reason: "Missing FOOTBALL_API_KEY"
    };
  }

  try {
    const response = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": API_KEY }
    });

    const data = await response.json();

    const suspended =
      data?.errors?.access ||
      JSON.stringify(data?.errors || {}).toLowerCase().includes("suspended");

    return {
      keyExists: true,
      active: !suspended && !data?.errors?.token,
      reason: suspended ? data.errors.access : null,
      raw: data
    };
  } catch (e) {
    return {
      keyExists: !!API_KEY,
      active: false,
      reason: e.message
    };
  }
}

// =========================
// ROUTES
// =========================

app.get("/", (req, res) => {
  res.json({
    app: "World Cup AI PRO",
    status: "LIVE",
    mode: "AI_SCORE_DEMO_READY",
    apiSports: "optional",
    endpoints: [
      "/test-api",
      "/status",
      "/matches",
      "/teams",
      "/team/:team",
      "/predict/:home/:away",
      "/top-scorer",
      "/champion",
      "/players/:team"
    ]
  });
});

app.get("/status", async (req, res) => {
  const api = await apiFootballStatus();

  res.json({
    server: true,

    mode: api.active ? "LIVE_API" : "DEMO_FALLBACK",

    keys: {
      footballApi: !!process.env.FOOTBALL_API_KEY,
      footballData: !!process.env.FOOTBALL_DATA_KEY,
      oddsApi: !!process.env.ODDS_API_KEY
    },

    apiFootball: api,

    generatedAt: new Date().toISOString()
  });
});

app.get("/matches", async (req, res) => {
  // כרגע API-Sports מושעה, אז מחזירים מודל דמו מלא.
  // כשישוחרר החשבון, אפשר להחליף כאן למשחקים אמיתיים.
  res.json(WORLD_CUP_MATCHES);
});

app.get("/teams", (req, res) => {
  const teams = Object.entries(TEAMS).map(([name, data]) => ({
    name,
    ...data,
    power: teamPower(name)
  }));

  res.json(teams);
});

app.get("/team/:team", (req, res) => {
  const team = req.params.team;
  const data = TEAMS[team];

  if (!data) {
    return res.status(404).json({ error: "Team not found" });
  }

  res.json({
    name: team,
    ...data,
    power: teamPower(team),
    players: PLAYER_POOL.filter(p => p.team === team)
  });
});

app.get("/predict/:home/:away", (req, res) => {
  const { home, away } = req.params;
  res.json(predictMatch(home, away));
});

app.get("/top-scorer", (req, res) => {
  const sorted = PLAYER_POOL
    .slice()
    .sort((a, b) => b.predictedGoals - a.predictedGoals || b.impact - a.impact);

  res.json(sorted);
});

app.get("/champion", (req, res) => {
  res.json(simulateChampion());
});

app.get("/players/:team", (req, res) => {
  const team = req.params.team;
  const players = PLAYER_POOL.filter(p => p.team === team);

  res.json(players);
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`World Cup AI PRO server running on port ${PORT}`);
});
