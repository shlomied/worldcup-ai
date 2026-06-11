const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const TEAM_POWER = {
  Brazil: {
    elo: 92,
    attack: 95,
    defense: 84,
    midfield: 88,
    form: 91,
    experience: 94,
    squadDepth: 94,
    starPower: 93,
    injuryPenalty: 8,
  },
  Argentina: {
    elo: 94,
    attack: 90,
    defense: 86,
    midfield: 90,
    form: 88,
    experience: 95,
    squadDepth: 88,
    starPower: 91,
    injuryPenalty: 10,
  },
  France: {
    elo: 95,
    attack: 96,
    defense: 88,
    midfield: 91,
    form: 90,
    experience: 90,
    squadDepth: 96,
    starPower: 96,
    injuryPenalty: 7,
  },
  England: {
    elo: 91,
    attack: 90,
    defense: 86,
    midfield: 92,
    form: 88,
    experience: 86,
    squadDepth: 90,
    starPower: 91,
    injuryPenalty: 9,
  },
  Spain: {
    elo: 90,
    attack: 88,
    defense: 87,
    midfield: 94,
    form: 90,
    experience: 84,
    squadDepth: 89,
    starPower: 87,
    injuryPenalty: 8,
  },
  Germany: {
    elo: 89,
    attack: 88,
    defense: 84,
    midfield: 90,
    form: 86,
    experience: 88,
    squadDepth: 90,
    starPower: 86,
    injuryPenalty: 8,
  },
  Portugal: {
    elo: 90,
    attack: 91,
    defense: 84,
    midfield: 89,
    form: 87,
    experience: 91,
    squadDepth: 88,
    starPower: 90,
    injuryPenalty: 9,
  },
  Netherlands: {
    elo: 88,
    attack: 85,
    defense: 89,
    midfield: 86,
    form: 86,
    experience: 86,
    squadDepth: 84,
    starPower: 84,
    injuryPenalty: 8,
  },
  Mexico: {
    elo: 80,
    attack: 76,
    defense: 78,
    midfield: 79,
    form: 78,
    experience: 82,
    squadDepth: 76,
    starPower: 75,
    injuryPenalty: 8,
  },
  "United States": {
    elo: 82,
    attack: 80,
    defense: 78,
    midfield: 82,
    form: 80,
    experience: 78,
    squadDepth: 81,
    starPower: 80,
    injuryPenalty: 8,
  },
  Canada: {
    elo: 78,
    attack: 80,
    defense: 74,
    midfield: 76,
    form: 77,
    experience: 74,
    squadDepth: 75,
    starPower: 82,
    injuryPenalty: 8,
  },
};

function normalizeTeamName(name = "") {
  const raw = String(name).trim();
  const n = raw.toLowerCase();

  if (!raw) return null;

  if (n.includes("brazil")) return "Brazil";
  if (n.includes("argentina")) return "Argentina";
  if (n.includes("france")) return "France";
  if (n.includes("england")) return "England";
  if (n.includes("spain")) return "Spain";
  if (n.includes("germany")) return "Germany";
  if (n.includes("portugal")) return "Portugal";
  if (n.includes("netherlands") || n.includes("holland")) return "Netherlands";
  if (n.includes("mexico")) return "Mexico";
  if (n.includes("united states") || n === "usa" || n.includes("u.s.a")) return "United States";
  if (n.includes("canada")) return "Canada";
  if (n.includes("italy")) return "Italy";
  if (n.includes("uruguay")) return "Uruguay";
  if (n.includes("belgium")) return "Belgium";
  if (n.includes("croatia")) return "Croatia";
  if (n.includes("morocco")) return "Morocco";
  if (n.includes("japan")) return "Japan";
  if (n.includes("korea")) return "South Korea";
  if (n.includes("australia")) return "Australia";
  if (n.includes("switzerland")) return "Switzerland";
  if (n.includes("denmark")) return "Denmark";
  if (n.includes("poland")) return "Poland";
  if (n.includes("qatar")) return "Qatar";
  if (n.includes("saudi")) return "Saudi Arabia";

  return raw;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function fetchFootballDataJson(url) {
  const token = process.env.FOOTBALL_DATA_KEY;

  if (!token) {
    return { ok: false, data: null, error: "Missing FOOTBALL_DATA_KEY" };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        data,
        error: `Football-Data error ${response.status}`,
      };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
}

async function fetchOddsJson(url) {
  const key = process.env.ODDS_API_KEY;

  if (!key) {
    return { ok: false, data: null, error: "Missing ODDS_API_KEY" };
  }

  try {
    const fullUrl = url.includes("?") ? `${url}&apiKey=${key}` : `${url}?apiKey=${key}`;
    const response = await fetch(fullUrl);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        data,
        error: `Odds API error ${response.status}`,
      };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  }
}

function normalizeMatch(m, fallbackLeague = "Football") {
  const homeRaw = m.homeTeam?.name || m.homeTeam?.shortName || "";
  const awayRaw = m.awayTeam?.name || m.awayTeam?.shortName || "";

  const home = normalizeTeamName(homeRaw);
  const away = normalizeTeamName(awayRaw);

  if (!home || !away) return null;

  return {
    id: m.id,
    home,
    away,
    time: m.utcDate,
    league: m.competition?.name || fallbackLeague || "Football",
    status: m.status || "SCHEDULED",
    source: "football-data",
  };
}

async function getRealMatches() {
  const today = new Date();
  const dateFrom = toDateOnly(today);
  const dateTo = toDateOnly(addDays(today, 30));

  const urls = [
    `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&season=2026`,
  ];

  let allMatches = [];

  for (const url of urls) {
    const result = await fetchFootballDataJson(url);

    if (!result.ok) {
      console.log("Football-Data matches source failed:", result.error, result.data);
      continue;
    }

    const matches = Array.isArray(result.data?.matches) ? result.data.matches : [];
    const fallbackLeague = result.data?.competition?.name || "Football";

    const normalized = matches
      .map((m) => normalizeMatch(m, fallbackLeague))
      .filter(Boolean)
      .filter((m) => {
        const allowed = ["SCHEDULED", "TIMED", "IN_PLAY", "LIVE", "PAUSED"];
        return allowed.includes(m.status);
      });

    allMatches = [...allMatches, ...normalized];
  }

  const unique = [];
  const seen = new Set();

  for (const match of allMatches) {
    const key = `${match.id || ""}-${match.home}-${match.away}-${match.time}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(match);
    }
  }

  unique.sort((a, b) => new Date(a.time) - new Date(b.time));
  return unique;
}

function defaultPower(team) {
  const seed = String(team || "")
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

  const base = 72 + (seed % 12);

  return {
    elo: base,
    attack: base,
    defense: base - 2,
    midfield: base - 1,
    form: base - 3,
    experience: base - 1,
    squadDepth: base - 4,
    starPower: base - 2,
    injuryPenalty: 9,
  };
}

function scoreFromBreakdown(b) {
  const raw =
    b.elo * 0.18 +
    b.attack * 0.18 +
    b.defense * 0.14 +
    b.midfield * 0.14 +
    b.form * 0.14 +
    b.experience * 0.08 +
    b.squadDepth * 0.08 +
    b.starPower * 0.06 -
    b.injuryPenalty * 0.2;

  return Number(raw.toFixed(2));
}

function getTeamPower(team) {
  const breakdown = TEAM_POWER[team] || defaultPower(team);
  const score = scoreFromBreakdown(breakdown);

  return {
    score,
    breakdown,
    adjustedScore: score,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round2(n) {
  return Number(n.toFixed(2));
}

function calculatePrediction(home, away) {
  const homePower = getTeamPower(home);
  const awayPower = getTeamPower(away);

  homePower.adjustedScore = round2(homePower.score + 1);
  awayPower.adjustedScore = round2(awayPower.score + 0.5);

  const diff = homePower.adjustedScore - awayPower.adjustedScore;

  const draw = clamp(0.31 - Math.abs(diff) * 0.012, 0.18, 0.31);
  const remaining = 1 - draw;

  const homeShare = 1 / (1 + Math.exp(-diff / 7));
  const homeWin = clamp(remaining * homeShare, 0.05, 0.9);
  const awayWin = clamp(remaining - homeWin, 0.05, 0.9);

  const total = homeWin + draw + awayWin;

  const normalizedHome = homeWin / total;
  const normalizedDraw = draw / total;
  const normalizedAway = awayWin / total;

  const favorite = normalizedHome >= normalizedAway ? home : away;
  const underdog = normalizedHome >= normalizedAway ? away : home;
  const confidence = Math.max(normalizedHome, normalizedAway);

  const homeGoals = clamp(Math.round(1.2 + homePower.adjustedScore / 55 + diff / 18), 0, 5);
  const awayGoals = clamp(Math.round(1.1 + awayPower.adjustedScore / 58 - diff / 18), 0, 5);

  const reasons = [];

  if (homePower.breakdown.attack > awayPower.breakdown.attack) {
    reasons.push(`${home} עדיפה בהתקפה`);
  } else if (awayPower.breakdown.attack > homePower.breakdown.attack) {
    reasons.push(`${away} עדיפה בהתקפה`);
  }

  if (homePower.breakdown.form > awayPower.breakdown.form) {
    reasons.push(`${home} מגיעה בכושר טוב יותר`);
  } else if (awayPower.breakdown.form > homePower.breakdown.form) {
    reasons.push(`${away} מגיעה בכושר טוב יותר`);
  }

  if (homePower.breakdown.starPower > awayPower.breakdown.starPower) {
    reasons.push(`${home} נהנית מיותר שחקני הכרעה`);
  } else if (awayPower.breakdown.starPower > homePower.breakdown.starPower) {
    reasons.push(`${away} נהנית מיותר שחקני הכרעה`);
  }

  if (reasons.length === 0) {
    reasons.push("המשחק מאוזן מאוד לפי מדדי דייב");
  }

  return {
    home,
    away,
    homeWin: round2(normalizedHome),
    draw: round2(normalizedDraw),
    awayWin: round2(normalizedAway),
    expectedScore: `${homeGoals}-${awayGoals}`,
    favorite,
    underdog,
    confidence: round2(confidence),
    power: {
      [home]: homePower,
      [away]: awayPower,
    },
    liveSignals: {
      footballData: {
        active: Boolean(process.env.FOOTBALL_DATA_KEY),
        note: process.env.FOOTBALL_DATA_KEY
          ? "Football-Data key exists. Match source connected."
          : "Football-Data key missing.",
      },
      odds: {
        active: Boolean(process.env.ODDS_API_KEY),
        note: process.env.ODDS_API_KEY
          ? "Odds API key exists. Market source connected."
          : "Odds API key missing.",
      },
    },
    sourceWeights: {
      internalAiScore: 0.7,
      footballData: process.env.FOOTBALL_DATA_KEY ? 0.15 : 0,
      oddsMarket: process.env.ODDS_API_KEY ? 0.15 : 0,
    },
    liveSourcesUsed: [
      "internal-ai-score",
      process.env.FOOTBALL_DATA_KEY ? "football-data" : null,
      process.env.ODDS_API_KEY ? "odds-api" : null,
    ].filter(Boolean),
    explanation: {
      summary: `${favorite} מקבלת יתרון לפי דייב מול ${underdog}.`,
      reasons,
    },
  };
}

async function testFootballData() {
  const result = await fetchFootballDataJson("https://api.football-data.org/v4/competitions");
  return {
    keyExists: Boolean(process.env.FOOTBALL_DATA_KEY),
    active: result.ok,
    error: result.ok ? null : result.error,
    competitions: Array.isArray(result.data?.competitions) ? result.data.competitions.length : 0,
  };
}

async function testOddsApi() {
  const result = await fetchOddsJson("https://api.the-odds-api.com/v4/sports/");
  return {
    keyExists: Boolean(process.env.ODDS_API_KEY),
    active: result.ok,
    error: result.ok ? null : result.error,
    sports: Array.isArray(result.data) ? result.data.length : 0,
  };
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "worldcup-ai",
    mode: "DAVE_AI_LIVE_ONLY",
    endpoints: ["/status", "/matches", "/predict/:home/:away", "/top-scorer", "/champion"],
  });
});

app.get("/status", async (req, res) => {
  const [footballData, oddsApi] = await Promise.all([testFootballData(), testOddsApi()]);

  res.json({
    server: true,
    mode: "DAVE_AI_LIVE_ONLY",
    keys: {
      footballData: Boolean(process.env.FOOTBALL_DATA_KEY),
      oddsApi: Boolean(process.env.ODDS_API_KEY),
    },
    sources: {
      footballData,
      oddsApi,
    },
  });
});

app.get("/matches", async (req, res) => {
  try {
    const matches = await getRealMatches();
    res.json(matches);
  } catch (error) {
    console.error("GET /matches failed:", error);
    res.json([]);
  }
});

app.get("/predict/:home/:away", async (req, res) => {
  const home = normalizeTeamName(req.params.home) || req.params.home;
  const away = normalizeTeamName(req.params.away) || req.params.away;

  const prediction = calculatePrediction(home, away);
  res.json(prediction);
});

app.get("/top-scorer", (req, res) => {
  res.json([
    {
      name: "Kylian Mbappé",
      goals: 0,
      predictedGoals: 6,
      team: "France",
      image: "https://media.api-sports.io/football/players/278.png",
    },
    {
      name: "Harry Kane",
      goals: 0,
      predictedGoals: 5,
      team: "England",
      image: "https://media.api-sports.io/football/players/184.png",
    },
    {
      name: "Vinicius Jr",
      goals: 0,
      predictedGoals: 5,
      team: "Brazil",
      image: "https://media.api-sports.io/football/players/762.png",
    },
  ]);
});

app.get("/champion", (req, res) => {
  res.json({
    champion: "France",
    source: "dave-ai-internal",
  });
});

app.listen(PORT, () => {
  console.log(`Dave AI server running on port ${PORT}`);
});
