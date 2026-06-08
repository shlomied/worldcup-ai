const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// חובה כדי לבדוק שהשרת חי
app.get("/", (req, res) => {
  res.send("⚽ World Cup AI is LIVE");
});

// API בדיקה
app.get("/predict/Brazil/Germany", (req, res) => {
  res.json({
    homeWin: 0.55,
    draw: 0.25,
    awayWin: 0.20,
    expectedScore: "2-1",
    confidence: 0.62
  });
});

// חשוב מאוד ל-Render
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
