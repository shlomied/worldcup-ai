const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("⚽ World Cup AI LIVE");
});

// 🔥 API אמיתי גנרי
app.get("/predict/:home/:away", (req, res) => {

  const { home, away } = req.params;

  // דמו חכם (אפשר לשדרג ל-AI אמיתי אחר כך)
  const homeWin = Math.random() * 0.6 + 0.2;
  const draw = Math.random() * 0.3;
  const awayWin = Math.max(0, 1 - homeWin - draw);

  res.json({
    homeWin,
    draw,
    awayWin,
    expectedScore: `${Math.floor(homeWin * 3)}-${Math.floor(awayWin * 3)}`,
    confidence: Math.random() * 0.3 + 0.6
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
