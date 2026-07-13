// puzzles/simon.js
// モジュール4: サイモン（記憶ゲーム）
// 爆弾側で色の点滅シーケンスを再生 → 解除班員は各色をマニュアルの変換表で
// 対応色に読み替え、その順にボタンを押す。
//
// 変換表は「シリアル末尾の奇偶」×「現在のミス回数（0/1/2以上の3段階）」の
// 組み合わせで切り替わる。ミスが増えるほど変換が単純な2組の入れ替えから
// 4色すべてが連鎖する巡回置換になり、終盤ほど油断できなくなる。

const COLORS = ["RED", "GREEN", "BLUE", "YELLOW"];

// マニュアルに載せる色変換表（点滅した色 → 押す色）
// ミス段階ごとに用意（0回 / 1回 / 2回以上）。いずれも自分自身への対応（点滅色そのもの）は無い。
const MAPS_EVEN = [
  { RED: "GREEN", GREEN: "RED", BLUE: "YELLOW", YELLOW: "BLUE" },   // ミス0: 2組の入れ替え
  { RED: "YELLOW", GREEN: "RED", BLUE: "GREEN", YELLOW: "BLUE" },   // ミス1: 4色循環
  { RED: "BLUE", GREEN: "YELLOW", BLUE: "GREEN", YELLOW: "RED" },   // ミス2以上: 4色循環（別配列）
];
const MAPS_ODD = [
  { RED: "BLUE", GREEN: "YELLOW", BLUE: "RED", YELLOW: "GREEN" },   // ミス0: 2組の入れ替え
  { RED: "GREEN", GREEN: "BLUE", BLUE: "YELLOW", YELLOW: "RED" },   // ミス1: 4色循環
  { RED: "GREEN", GREEN: "YELLOW", BLUE: "RED", YELLOW: "BLUE" },   // ミス2以上: 4色循環（別配列）
];

function rand(n) { return Math.floor(Math.random() * n); }

// ミス回数を 0 / 1 / 2 の3段階に丸める（3ミスで即ゲームオーバーのため実質0〜2）
function mistakeTier(mistakes) {
  return Math.min(mistakes, 2);
}

function mapFor(serialOdd, mistakes) {
  const tables = serialOdd ? MAPS_ODD : MAPS_EVEN;
  return tables[mistakeTier(mistakes)];
}

function generate(serialOdd) {
  const len = 4;
  const sequence = [];
  for (let i = 0; i < len; i++) sequence.push(COLORS[rand(COLORS.length)]);
  // 正解は固定で持たず、判定時点の「シリアル奇偶 × 現在のミス回数」で都度算出する
  return { id: 4, type: "simon", sequence };
}

// submitted: 押した色の配列 / serialOdd: 機体のシリアル末尾奇偶 / mistakes: 判定時点でのミス回数
function judge(puzzle, submitted, serialOdd, mistakes) {
  if (!Array.isArray(submitted)) return false;
  const map = mapFor(serialOdd, mistakes || 0);
  const answer = puzzle.sequence.map((c) => map[c]);
  if (submitted.length !== answer.length) return false;
  return answer.every((c, i) => c === submitted[i]);
}

module.exports = { generate, judge, mapFor, mistakeTier, COLORS, MAPS_EVEN, MAPS_ODD };
