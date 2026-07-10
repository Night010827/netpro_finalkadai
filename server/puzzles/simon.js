// puzzles/simon.js
// モジュール4: サイモン（記憶ゲーム）
// 爆弾側で色の点滅シーケンスを再生 → 解除班員は各色をマニュアルの変換表で
// 対応色に読み替え、その順にボタンを押す。
// 変換表はシリアル末尾の奇偶で切り替わる。

const COLORS = ["RED", "GREEN", "BLUE", "YELLOW"];

// マニュアルに載せる色変換表（点滅した色 → 押す色）
const MAP_ODD = { RED: "BLUE", GREEN: "YELLOW", BLUE: "RED", YELLOW: "GREEN" };
const MAP_EVEN = { RED: "GREEN", GREEN: "RED", BLUE: "YELLOW", YELLOW: "BLUE" };

function rand(n) { return Math.floor(Math.random() * n); }

function generate(serialOdd) {
  const len = 4;
  const sequence = [];
  for (let i = 0; i < len; i++) sequence.push(COLORS[rand(COLORS.length)]);
  const map = serialOdd ? MAP_ODD : MAP_EVEN;
  const answer = sequence.map((c) => map[c]);
  return { id: 4, type: "simon", sequence, answer };
}

// submitted: 押した色の配列
function judge(puzzle, submitted) {
  if (!Array.isArray(submitted)) return false;
  if (submitted.length !== puzzle.answer.length) return false;
  return puzzle.answer.every((c, i) => c === submitted[i]);
}

module.exports = { generate, judge, COLORS, MAP_ODD, MAP_EVEN };
