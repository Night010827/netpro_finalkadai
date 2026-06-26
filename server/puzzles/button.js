// puzzles/button.js
// モジュール4: ボタンを TAP するか HOLD するか

const COLORS = ["RED", "BLUE", "YELLOW", "WHITE"];
const LABELS = ["PRESS", "HOLD", "ABORT", "DETONATE"];

function rand(n) { return Math.floor(Math.random() * n); }

function correctActionOf(color, label, serialOdd) {
  if (label === "ABORT") return "tap";
  if (color === "RED") return "tap";
  if (serialOdd) return "hold";
  return "tap";
}

function generate(serialOdd) {
  const color = COLORS[rand(COLORS.length)];
  const label = LABELS[rand(LABELS.length)];
  return {
    id: 4,
    type: "button",
    color,
    label,
    correctAction: correctActionOf(color, label, serialOdd),
  };
}

function judge(puzzle, action) {
  return action === puzzle.correctAction;
}

module.exports = { generate, judge };
