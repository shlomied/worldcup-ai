const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

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

function match(a, b) {
  const A = TEAMS[a].power;
  const B = TEAMS[b].power;

  const p = A / (A + B);

  const gA = Math.round(Math.random() * 3 * p);
  const gB = Math.round(Math.random() * 3 * (1 - p));

  return {
    winner: gA >= gB ? a : b,
    score: `${gA}-${gB}`,
    p
  };
}

function run() {
  let teams = Object.keys(TEAMS);

  const rounds = {
    roundOf16: [],
    quarterFinal: [],
    semiFinal: [],
    final: [],
    champion: null,
    scorers: {}
  };

  let round = 1;

  while (teams.length > 1) {
    const next = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      const r = match(a, b);

      next.push(r.winner);

      rounds.scorers[a] = (rounds.scorers[a] || 0) + Math.floor(Math.random() * 3);
      rounds.scorers[b] = (rounds.scorers[b] || 0) + Math.floor(Math.random() * 2);

      const obj = { a, b, ...r };

      if (round === 1) rounds.roundOf16.push(obj);
      if (round === 2) rounds.quarterFinal.push(obj);
      if (round === 3) rounds.semiFinal.push(obj);
      if (round === 4) rounds.final.push(obj);
    }

    teams = next;
    round++;
  }

  rounds.champion = teams[0];

  let best = null;
  let goals = 0;

  for (let t in rounds.scorers) {
    if (rounds.scorers[t] > goals) {
      goals = rounds.scorers[t];
      best = t;
    }
  }

  rounds.topScorer = {
    player: TEAMS[best]?.star,
    goals
  };

  return rounds;
}

function ensure() {
  if (!tournament) tournament = run();
}

app.get("/bracket", (req, res) => {
  ensure();
  res.json(tournament);
});

app.get("/predict/:a/:b", (req, res) => {
  const A = TEAMS[req.params.a].power;
  const B = TEAMS[req.params.b].power;

  const p = A / (A + B);

  res.json({
    homeWin: p,
    awayWin: 1 - p,
    expectedScore: `${Math.round(p * 3)}-${Math.round((1 - p) * 3)}`
  });
});

app.listen(PORT, () => console.log("RUNNING"));
