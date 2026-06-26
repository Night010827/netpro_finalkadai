// puzzles/code.js
// モジュール2: 4桁コード入力
// 規則: シリアル末尾奇数 → 表示の逆順 / 偶数 → 4桁の合計を4桁ゼロ埋め

function rand(n) { return Math.floor(Math.random() * n); }

function computeAnswer(display, serialOdd) {
  if (serialOdd) {
    return [...display].reverse().join("");
  }
  const sum = display.reduce((a, b) => a + b, 0);
  return String(sum).padStart(4, "0");
}

function generate(serialOdd) {
  const display = [rand(10), rand(10), rand(10), rand(10)];
  const answer = computeAnswer(display, serialOdd);
  return { id: 2, type: "code", display, answer };
}

function judge(puzzle, submitted) {
  return String(submitted) === String(puzzle.answer);
}

module.exports = { generate, judge };
