// puzzles/morse.js
// モジュール3: モールスパターン → 周波数チャンネル選択

const PATTERNS = [
  { id: "U", pattern: ["dot", "dot", "dash"],          channel: 1 },
  { id: "D", pattern: ["dash", "dot", "dot"],          channel: 2 },
  { id: "R", pattern: ["dot", "dash", "dot"],          channel: 3 },
  { id: "G", pattern: ["dash", "dash", "dot"],         channel: 4 },
  { id: "H", pattern: ["dot", "dot", "dot", "dot"],    channel: 5 },
];

function rand(n) { return Math.floor(Math.random() * n); }

function generate() {
  const pick = PATTERNS[rand(PATTERNS.length)];
  return {
    id: 3,
    type: "morse",
    patternId: pick.id,
    pattern: pick.pattern,
    correctChannel: pick.channel,
  };
}

function judge(puzzle, channel) {
  return Number(channel) === puzzle.correctChannel;
}

module.exports = { generate, judge, PATTERNS };
