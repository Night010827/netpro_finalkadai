// puzzles/code.js
// モジュール2: 4桁コード入力（多段変換ルール）
// 規則:
//   K = 表示4桁の合計の「一の位」
//   各桁 = (表示の桁 + K) mod 10
//   シリアル末尾が奇数なら、その4桁を逆順にする
// 例: 表示 3 8 2 5 → 合計18 → K=8 → 各桁+8mod10 = 1 6 0 3
//     奇数なら 3 0 6 1 / 偶数なら 1 6 0 3

function rand(n) { return Math.floor(Math.random() * n); }

function computeAnswer(display, serialOdd) {
  const K = display.reduce((a, b) => a + b, 0) % 10;
  const shifted = display.map((d) => (d + K) % 10);
  const ordered = serialOdd ? [...shifted].reverse() : shifted;
  return ordered.join("");
}

function generate(serialOdd) {
  const display = [rand(10), rand(10), rand(10), rand(10)];
  const answer = computeAnswer(display, serialOdd);
  return { id: 2, type: "code", display, answer };
}

function judge(puzzle, submitted) {
  return String(submitted) === String(puzzle.answer);
}

module.exports = { generate, judge, computeAnswer };
