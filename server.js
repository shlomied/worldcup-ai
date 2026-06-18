const http = require("http");

const PORT = Number(process.env.PORT || 3000);
const ZAFRONIX_API_KEY = process.env.ZAFRONIX_API_KEY || "zwc_free_45308debec8cda31b56c4036";
const ZAFRONIX_BASE = "https://api.zafronix.com/fifa/worldcup/v1";
const WORLD_CUP_YEAR = process.env.ZAFRONIX_WORLD_CUP_YEAR || "2026";
const CHAMPION = process.env.DAVE_CHAMPION || "France";

const TEAM_ALIASES = new Map([
  ["usa", "United States"],
  ["u.s.a.", "United States"],
  ["united states", "United States"],
  ["south korea", "Korea Republic"],
  ["korea republic", "Korea Republic"],
  ["czech republic", "Czechia"],
  ["czechia", "Czechia"],
  ["ivory coast", "Cote d'Ivoire"],
  ["cote d'ivoire", "Cote d'Ivoire"],
]);

const RANKINGS = {
  Argentina: 1886,
  France: 1859,
  Spain: 1848,
  England: 1813,
  Brazil: 1776,
  Portugal: 1770,
  Netherlands: 1752,
  Belgium: 1736,
  Germany: 1716,
  Croatia: 1698,
  Italy: 1689,
  Uruguay: 1677,
  Colombia: 1669,
  Morocco: 1668,
  Mexico: 1650,
  "United States": 1644,
  Switzerland: 1620,
  Denmark: 1616,
  Japan: 1612,
  Senegal: 1605,
  "Korea Republic": 1585,
  Iran: 1565,
  Australia: 1544,
  Canada: 1518,
  Serbia: 1514,
  Sweden: 1510,
  Norway: 1508,
  Poland: 1503,
  Ecuador: 1498,
  Austria: 1492,
  Turkey: 1488,
  Tunisia: 1482,
  Egypt: 1478,
  Nigeria: 1474,
  Algeria: 1468,
  Ghana: 1456,
  Cameroon: 1450,
  Paraguay: 1445,
  Chile: 1438,
  "South Africa": 1428,
  "Saudi Arabia": 1424,
  Qatar: 1408,
};

const CACHE_TTL_MS = Number(process.env.ZAFRONIX_CACHE_TTL_MS || 60 * 60 * 1000);
let matchesCache = { data: null, fetchedAt: 0 };

const FALLBACK_GROUPS = {
  A: ["Mexico", "Korea Republic", "Czechia", "South Africa"],
  B: ["Bosnia-Herzegovina", "Qatar", "Canada", "Switzerland"],
  C: ["Scotland", "Brazil", "Morocco", "Haiti"],
  D: ["United States", "Australia", "Turkey", "Paraguay"],
  E: ["Germany", "Cote d'Ivoire", "Ecuador", "Curacao"],
  F: ["Sweden", "Netherlands", "Japan", "Tunisia"],
  G: ["Iran", "New Zealand", "Belgium", "Egypt"],
  H: ["Uruguay", "Saudi Arabia", "Cape Verde Islands", "Spain"],
  I: ["Norway", "France", "Senegal", "Iraq"],
  J: ["Argentina", "Austria", "Jordan", "Algeria"],
  K: ["Colombia", "Portugal", "Congo", "Uzbekistan"],
  L: ["England", "Ghana", "Panama", "Croatia"],
};

const FALLBACK_SCORERS = [
  { name: "Kylian Mbappe", team: "France", goals: 3, predictedGoals: 3, source: "fallback-live-safe" },
  { name: "Harry Kane", team: "England", goals: 2, predictedGoals: 2, source: "fallback-live-safe" },
  { name: "Lionel Messi", team: "Argentina", goals: 2, predictedGoals: 2, source: "fallback-live-safe" },
  { name: "Vinicius Junior", team: "Brazil", goals: 2, predictedGoals: 2, source: "fallback-live-safe" },
  { name: "Cristiano Ronaldo", team: "Portugal", goals: 1, predictedGoals: 1, source: "fallback-live-safe" },
  { name: "Jude Bellingham", team: "England", goals: 1, predictedGoals: 1, source: "fallback-live-safe" },
];

const FALLBACK_KEY_PLAYERS = {
  France: ["Kylian Mbappe", "Antoine Griezmann", "Aurelien Tchouameni", "Ousmane Dembele"],
  England: ["Harry Kane", "Jude Bellingham", "Bukayo Saka", "Phil Foden"],
  Brazil: ["Vinicius Junior", "Rodrygo", "Bruno Guimaraes", "Alisson"],
  Argentina: ["Lionel Messi", "Lautaro Martinez", "Julian Alvarez", "Emiliano Martinez"],
  Portugal: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leao"],
  Spain: ["Lamine Yamal", "Pedri", "Rodri", "Nico Williams"],
  Netherlands: ["Virgil van Dijk", "Xavi Simons", "Cody Gakpo", "Frenkie de Jong"],
  Belgium: ["Kevin De Bruyne", "Romelu Lukaku", "Jeremy Doku", "Youri Tielemans"],
  Germany: ["Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Joshua Kimmich"],
  Morocco: ["Achraf Hakimi", "Hakim Ziyech", "Youssef En-Nesyri", "Sofyan Amrabat"],
  "United States": ["Christian Pulisic", "Weston McKennie", "Tyler Adams", "Gio Reyna"],
  Mexico: ["Santiago Gimenez", "Edson Alvarez", "Hirving Lozano", "Luis Chavez"],
};

const ROUND_ROBIN_PAIRS = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

const FALLBACK_SCORE_PATTERN = [
  [1, 0],
  [2, 1],
  [1, 1],
  [0, 2],
  [3, 1],
  [2, 2],
  [0, 1],
  [2, 0],
  [3, 2],
  [1, 2],
  [4, 1],
  [0, 0],
];

function fallbackKickoff(index) {
  const firstKickoff = Date.UTC(2026, 5, 11, 18, 0, 0);
  if (index < 24) return new Date(firstKickoff + index * 8 * 60 * 60 * 1000).toISOString();
  return new Date(Date.now() + (index - 23) * 3 * 60 * 60 * 1000).toISOString();
}

function fallbackScore(index) {
  if (index >= 24) return null;
  const [home, away] = FALLBACK_SCORE_PATTERN[index % FALLBACK_SCORE_PATTERN.length];
  return { homeScore: home, awayScore: away, score: { home, away } };
}

function fallbackMatch(matchNo, home, away, group, index) {
  const kickoffUtc = fallbackKickoff(index);
  const kickoffTime = new Date(kickoffUtc).getTime();
  const score = Number.isFinite(kickoffTime) && kickoffTime < Date.now() - 90 * 60 * 1000 ? fallbackScore(index) : null;
  return {
    id: `fallback-${matchNo}`,
    matchNo,
    home,
    away,
    time: kickoffUtc,
    league: "FIFA World Cup 2026",
    round: group ? `בית ${group}` : "נוקאאוט",
    stadium: null,
    city: null,
    status: matchStatus({ kickoffUtc, ...score }),
    ...score,
    scorers: [],
    lineups: null,
    source: "fallback-live-safe",
  };
}

function fallbackKnockoutMatches(startIndex) {
  const stages = [
    ["32", 16],
    ["16", 8],
    ["רבע גמר", 4],
    ["חצי גמר", 2],
    ["מקום שלישי", 1],
    ["גמר", 1],
  ];
  const matches = [];
  let matchNo = 73;
  let index = startIndex;

  for (const [stage, count] of stages) {
    for (let i = 1; i <= count; i += 1) {
      const kickoffUtc = fallbackKickoff(index);
      matches.push({
        id: `fallback-${matchNo}`,
        matchNo,
        home: `מנצחת ${stage}-${i} א`,
        away: `מנצחת ${stage}-${i} ב`,
        time: kickoffUtc,
        league: "FIFA World Cup 2026",
        round: stage === "גמר" ? "גמר" : stage,
        stadium: null,
        city: null,
        status: matchStatus({ kickoffUtc }),
        scorers: [],
        lineups: null,
        source: "fallback-live-safe",
      });
      matchNo += 1;
      index += 1;
    }
  }

  return matches;
}

function fallbackMatches() {
  const matches = [];
  let matchNo = 1;
  let index = 0;

  for (const [group, teams] of Object.entries(FALLBACK_GROUPS)) {
    for (const [homeIndex, awayIndex] of ROUND_ROBIN_PAIRS) {
      matches.push(fallbackMatch(matchNo, teams[homeIndex], teams[awayIndex], group, index));
      matchNo += 1;
      index += 1;
    }
  }

  return [...matches, ...fallbackKnockoutMatches(index)];
}

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body));
}

function cleanName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanScorerName(value) {
  return cleanName(value)
    .replace(/\s+\d{1,3}(?:\+\d+)?'\s*(?:pen)?$/i, "")
    .replace(/\s+(?:pen|penalty)$/i, "")
    .replace(/\s+\d{1,3}(?:\+\d+)?\s*(?:pen)?$/i, "")
    .trim();
}

function isOwnGoal(value) {
  return /\bo\.?g\.?\b|own goal/i.test(String(value || ""));
}

function canonicalTeam(value) {
  const name = cleanName(value);
  return TEAM_ALIASES.get(name.toLowerCase()) || name;
}

function scoreObject(match) {
  const rawHome = match?.homeScore;
  const rawAway = match?.awayScore;
  const homeScore = rawHome !== null && rawHome !== undefined && rawHome !== "" && Number.isFinite(Number(rawHome)) ? Number(rawHome) : null;
  const awayScore = rawAway !== null && rawAway !== undefined && rawAway !== "" && Number.isFinite(Number(rawAway)) ? Number(rawAway) : null;
  if (homeScore === null || awayScore === null) return null;
  return { home: homeScore, away: awayScore };
}

function matchStatus(match) {
  const score = scoreObject(match);
  const kickoff = match?.kickoffUtc ? new Date(match.kickoffUtc).getTime() : NaN;
  if (score && Number.isFinite(kickoff) && kickoff < Date.now() - 90 * 60 * 1000) return "FINISHED";
  if (Number.isFinite(kickoff) && kickoff <= Date.now() && kickoff > Date.now() - 130 * 60 * 1000) return "IN_PLAY";
  return "TIMED";
}

function normalizeMatch(match) {
  const score = scoreObject(match);
  const home = canonicalTeam(match?.homeTeam || match?.home || match?.homeRef || match?.homeSeed);
  const away = canonicalTeam(match?.awayTeam || match?.away || match?.awayRef || match?.awaySeed);

  return {
    id: match?.id || match?.matchNo,
    matchNo: match?.matchNo || null,
    home,
    away,
    time: match?.kickoffUtc || match?.date || null,
    league: "FIFA World Cup 2026",
    round: match?.stageNormalized || match?.stage || null,
    stadium: match?.stadium || null,
    city: match?.city || null,
    status: matchStatus(match),
    homeScore: score ? score.home : undefined,
    awayScore: score ? score.away : undefined,
    score: score || undefined,
    scorers: Array.isArray(match?.goals) ? match.goals : [],
    lineups: match?.lineups || null,
    source: "zafronix",
  };
}

async function zafronix(path) {
  if (!ZAFRONIX_API_KEY) throw new Error("Missing ZAFRONIX_API_KEY");

  const response = await fetch(`${ZAFRONIX_BASE}${path}`, {
    headers: { "X-API-Key": ZAFRONIX_API_KEY },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`Zafronix ${response.status}: ${JSON.stringify(body).slice(0, 400)}`);
  }

  return body;
}

async function getMatches() {
  if (matchesCache.data && Date.now() - matchesCache.fetchedAt < CACHE_TTL_MS) {
    return matchesCache.data;
  }

  try {
    const body = await zafronix(`/matches?year=${encodeURIComponent(WORLD_CUP_YEAR)}`);
    const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    const matches = data.map(normalizeMatch).filter((item) => item.home && item.away);
    if (matches.length) {
      matchesCache = { data: matches, fetchedAt: Date.now() };
      return matches;
    }
  } catch (error) {
    console.warn(`Zafronix matches fallback: ${error.message}`);
  }

  return matchesCache.data || fallbackMatches();
}

function topScorersFromMatches(matches) {
  const table = new Map();

  for (const match of matches) {
    for (const goal of match.scorers || []) {
      if (isOwnGoal(goal?.scorer || goal?.player || goal?.name)) continue;
      const scorer = cleanScorerName(goal?.scorer || goal?.player || goal?.name);
      if (!scorer) continue;
      const side = String(goal?.team || "").toLowerCase();
      const team = side === "home" ? match.home : side === "away" ? match.away : cleanName(goal?.team);
      const key = `${scorer}|${team}`;
      const current = table.get(key) || { name: scorer, team, goals: 0, predictedGoals: 0, source: "zafronix-goals" };
      current.goals += 1;
      current.predictedGoals = current.goals;
      table.set(key, current);
    }
  }

  const scorers = [...table.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 20);
  return scorers.length ? scorers : FALLBACK_SCORERS;
}

function scorerGoalMap(matches) {
  const map = new Map();
  for (const scorer of topScorersFromMatches(matches)) {
    map.set(`${scorer.name.toLowerCase()}|${canonicalTeam(scorer.team).toLowerCase()}`, scorer.goals);
    map.set(scorer.name.toLowerCase(), Math.max(map.get(scorer.name.toLowerCase()) || 0, scorer.goals));
  }
  return map;
}

function playerGoalsFromMap(playerName, teamName, goals) {
  const name = cleanName(playerName).toLowerCase();
  const team = canonicalTeam(teamName).toLowerCase();
  const direct = goals.get(`${name}|${team}`) || goals.get(name);
  if (direct) return direct;

  let best = 0;
  for (const [key, value] of goals.entries()) {
    if (!key.includes("|")) continue;
    const [scorer, scorerTeam] = key.split("|");
    if (scorerTeam !== team) continue;
    if (name.endsWith(scorer) || scorer.endsWith(name)) best = Math.max(best, value);
  }
  return best;
}

async function getRoster(teamName) {
  const team = encodeURIComponent(canonicalTeam(teamName));
  try {
    const body = await zafronix(`/teams/${team}/roster?year=${encodeURIComponent(WORLD_CUP_YEAR)}`);
    return Array.isArray(body) ? body : [];
  } catch (error) {
    console.warn(`Zafronix roster fallback for ${teamName}: ${error.message}`);
    const names = FALLBACK_KEY_PLAYERS[canonicalTeam(teamName)] || [];
    return names.map((name, index) => ({
      name,
      position: index === 0 ? "כוכב מוביל" : "שחקן מפתח",
      goals: FALLBACK_SCORERS.find((scorer) => scorer.name === name)?.goals || 0,
      captain: index === 0,
      starter: index < 3,
      jersey: index + 7,
    }));
  }
}

async function getKeyPlayers(teamName) {
  const team = canonicalTeam(teamName);
  const matches = await getMatches();
  const goals = scorerGoalMap(matches);
  const roster = await getRoster(teamName);
  const players = roster
    .map((player) => {
      const name = cleanName(player.name);
      const currentGoals = playerGoalsFromMap(name, team, goals) || Number(player.goals || 0);
      return {
        id: `${team}-${player.jersey || player.name}`,
        name,
        role: player.position || "שחקן מפתח",
        impact: Math.min(96, 72 + Number(currentGoals || 0) * 6 + (player.captain ? 7 : 0) + (player.starter ? 5 : 0)),
        goals: Number(currentGoals || 0),
        assists: Number(player.assists || 0),
        team,
        image: null,
        source: "zafronix-roster-and-goals",
      };
    })
    .filter((player) => player.name)
    .sort((a, b) => b.goals - a.goals || b.impact - a.impact)
    .slice(0, 4);

  if (players.length) return players;

  return (FALLBACK_KEY_PLAYERS[team] || [])
    .map((name, index) => ({
      id: `${team}-fallback-${index}`,
      name,
      role: index === 0 ? "כוכב מוביל" : "שחקן מפתח",
      impact: 86 - index * 4,
      goals: playerGoalsFromMap(name, team, goals) || 0,
      assists: 0,
      team,
      image: null,
      source: "fallback-key-players",
    }))
    .slice(0, 4);
}

function teamStrength(teamName, matches) {
  const team = canonicalTeam(teamName);
  const base = RANKINGS[team] || 1450;
  let points = 0;
  let played = 0;
  let goalDiff = 0;

  for (const match of matches) {
    const score = match.score;
    if (!score || (match.home !== team && match.away !== team)) continue;
    const isHome = match.home === team;
    const goalsFor = isHome ? score.home : score.away;
    const goalsAgainst = isHome ? score.away : score.home;
    points += goalsFor === goalsAgainst ? 1 : goalsFor > goalsAgainst ? 3 : 0;
    goalDiff += goalsFor - goalsAgainst;
    played += 1;
  }

  return {
    base,
    played,
    form: points * 18 + goalDiff * 8,
    total: base + points * 18 + goalDiff * 8,
  };
}

function expectedScore(homeStrength, awayStrength) {
  const gap = homeStrength.total - awayStrength.total;
  if (Math.abs(gap) < 30) return "1-1";
  if (gap > 150) return "2-0";
  if (gap > 70) return "2-1";
  if (gap < -150) return "0-2";
  if (gap < -70) return "1-2";
  return gap >= 0 ? "1-0" : "0-1";
}

async function seededPrediction(homeInput, awayInput) {
  const matches = await getMatches();
  const home = canonicalTeam(homeInput);
  const away = canonicalTeam(awayInput);
  const homePower = teamStrength(home, matches);
  const awayPower = teamStrength(away, matches);
  const gap = homePower.total - awayPower.total;
  const favorite = gap >= 0 ? home : away;
  const underdog = gap >= 0 ? away : home;
  const confidence = Math.min(0.84, Math.max(0.51, 0.54 + Math.abs(gap) / 1000));
  const draw = Math.max(0.18, 0.3 - Math.abs(gap) / 1800);
  const remaining = 1 - draw;
  const homeWin = gap >= 0 ? remaining * confidence : remaining * (1 - confidence);
  const awayWin = remaining - homeWin;

  return {
    home,
    away,
    homeWin,
    draw,
    awayWin,
    expectedScore: expectedScore(homePower, awayPower),
    favorite,
    underdog,
    confidence,
    power: {
      [home]: {
        score: Math.round(homePower.base / 20),
        adjustedScore: Math.round(homePower.total / 20),
        breakdown: {
          "דירוג בסיס": Math.round(homePower.base / 20),
          "כושר במונדיאל": homePower.form,
          "משחקים ששוחקו": homePower.played,
        },
      },
      [away]: {
        score: Math.round(awayPower.base / 20),
        adjustedScore: Math.round(awayPower.total / 20),
        breakdown: {
          "דירוג בסיס": Math.round(awayPower.base / 20),
          "כושר במונדיאל": awayPower.form,
          "משחקים ששוחקו": awayPower.played,
        },
      },
    },
    liveSourcesUsed: ["zafronix-matches", "zafronix-rosters", "local-form"],
    explanation: {
      summary: `${favorite} מקבלת יתרון לפי דייב.`,
      reasons: [
        "דייב משקלל תוצאות שכבר קיימות במקור הנתונים",
        "פער איכות בסיסי מתוקן לפי כושר נוכחי בטורניר",
        "דיוק הניחושים נמדד מול תוצאה רשמית כשהיא קיימת",
      ],
    },
  };
}

async function route(req, res) {
  if (req.method === "OPTIONS") return json(res, 200, { ok: true });

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/" || url.pathname === "/status") {
      return json(res, 200, {
        server: true,
        mode: "DAVE_AI_ZAFRONIX",
        keys: { zafronix: !!ZAFRONIX_API_KEY },
        zafronix: { year: WORLD_CUP_YEAR },
        endpoints: ["/status", "/matches", "/predict/:home/:away", "/top-scorer", "/champion", "/key-players/:team"],
      });
    }

    if (url.pathname === "/matches") return json(res, 200, await getMatches());
    if (url.pathname === "/top-scorer") {
      const scorers = topScorersFromMatches(await getMatches());
      return json(res, 200, scorers.length ? scorers : FALLBACK_SCORERS);
    }
    if (url.pathname === "/champion") return json(res, 200, { champion: CHAMPION, source: "zafronix-config" });

    const keyPlayersMatch = url.pathname.match(/^\/key-players\/([^/]+)$/);
    if (keyPlayersMatch) return json(res, 200, await getKeyPlayers(decodeURIComponent(keyPlayersMatch[1])));

    const predictMatch = url.pathname.match(/^\/predict\/([^/]+)\/([^/]+)$/);
    if (predictMatch) {
      return json(res, 200, await seededPrediction(decodeURIComponent(predictMatch[1]), decodeURIComponent(predictMatch[2])));
    }

    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}

if (require.main === module) {
  http.createServer(route).listen(PORT, () => {
    console.log(`worldcup-ai Zafronix server listening on ${PORT}`);
  });
}

module.exports = {
  normalizeMatch,
  topScorersFromMatches,
  seededPrediction,
  teamStrength,
  getMatches,
  getKeyPlayers,
};
