const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

const TEAMS = {
  Brazil: { power: 92, star: "Neymar" },
  Germany: { power: 88, star: "Musiala" },
  France: { power: 91, star: "Mbappé" },
  Spain: { power: 86, star: "Yamal" },
  Argentina: { power: 90, star: "Messi" },
  England: { power: 87, star: "Kane" },
  Portugal: { power: 85, star: "Ronaldo" },
  Netherlands: { power: 84, star: "de Jong" }
};

let tournament = null;

/**
 * ⚽ משחק
 */
function play(a, b) {
  const aP = TEAMS[a].power;
  const bP = TEAMS[b].power;

  const aChance = aP / (aP + bP);

  const goalsA = Math.round(Math.random() * 3 * aChance);
  const goalsB = Math.round(Math.random() * 3 * (1 - aChance));

  return {
    winner: goalsA >= goalsB ? a : b,
    goalsA,
    goalsB
  };
}

/**
 * 🏆 טורניר מלא
 */
function runTournament() {
  let teams = Object.keys(TEAMS);
  let scorers = {};

  const rounds = {
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: [],
    champion: null
  };

  let round = 1;

  while (teams.length > 1) {
    let next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const res = play(a, b);

      next.push(res.winner);

      scorers[a] = (scorers[a] || 0) + res.goalsA;
      scorers[b] = (scorers[b] || 0) + res.goalsB;

      const matchObj = {
        a,
        b,
        winner: res.winner,
        score: `${res.goalsA}-${res.goalsB}`
      };

      if (round === 1) rounds.roundOf16.push(matchObj);
      if (round === 2) rounds.quarterFinal.push(matchObj);
      if (round === 3) rounds.semiFinal.push(matchObj);
      if (round === 4) rounds.final.push(matchObj);
    }

    teams = next;
    round++;
  }

  rounds.champion = teams[0];

  let topPlayer = null;
  let topGoals = 0;

  for (let t in scorers) {
    if (scorers[t] > topGoals) {
      topGoals = scorers[t];
      topPlayer = t;
    }
  }

  return {
    ...rounds,
    scorers,
    topScorer: {
      player: TEAMS[topPlayer]?.star || topPlayer,
      goals: topGoals
    }
  };
}

function ensure() {
  if (!tournament) tournament = runTournament();
}

/**
 * 🏠 health
 */
app.get("/", (req, res) => {
  res.send("WORLD CUP AI FINAL V4");
});

/**
 * ⚽ matches
 */
app.get("/matches", (req, res) => {
  res.json(Object.keys(TEAMS).map((t, i, arr) => {
    if (i % 2 === 0) {
      return {
        home: arr[i],
        away: arr[i + 1]
      };
    }
  }).filter(Boolean));
});

/**
 * 🧠 predict
 */
app.get("/predict/:a/:b", (req, res) => {
  const a = TEAMS[req.params.a].power;
  const b = TEAMS[req.params.b].power;

  const p = a / (a + b);

  res.json({
    homeWin: Number(p.toFixed(2)),
    awayWin: Number((1 - p).toFixed(2)),
    draw: 0.15,
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`
  });
});

/**
 * 🏆 bracket
 */
app.get("/bracket", (req, res) => {
  ensure();
  res.json(tournament);
});

/**
 * 🏆 champion
 */
app.get("/champion", (req, res) => {
  ensure();
  res.json({ champion: tournament.champion });
});

/**
 * 👑 top scorer
 */
app.get("/top-scorer", (req, res) => {
  ensure();
  res.json(tournament.topScorer);
});

/**
 * 🧠 AI insight
 */
app.get("/insight/:team", (req, res) => {
  const t = req.params.team;
  const p = TEAMS[t]?.power || 80;

  res.json({
    team: t,
    winChance: p / 100,
    reasons: [
      "כושר משחק גבוה",
      "ניסיון בינלאומי",
      "סגל חזק"
    ]
  });
});

app.listen(PORT, () => console.log("FINAL SERVER RUNNING"));
