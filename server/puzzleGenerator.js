// puzzleGenerator.js
// 4つのパズルモジュールを生成する

const wire = require("./puzzles/wire");
const code = require("./puzzles/code");
const morse = require("./puzzles/morse");
const button = require("./puzzles/button");

function rand(n) {
  return Math.floor(Math.random() * n);
}

function generateAllPuzzles() {
  const serialOdd = rand(2) === 1;
  return {
    puzzles: [
      wire.generate(serialOdd),
      code.generate(serialOdd),
      morse.generate(),
      button.generate(serialOdd),
    ],
    serialOdd,
  };
}

// クライアントAに送る用：答えを除いたデータ
function sanitizeForClient(puzzleData) {
  const stripped = puzzleData.puzzles.map((p) => {
    const copy = { ...p };
    delete copy.correctIndex;    // wire
    delete copy.answer;          // code
    delete copy.correctChannel;  // morse
    delete copy.correctAction;   // button
    return copy;
  });
  return { puzzles: stripped, serialOdd: puzzleData.serialOdd };
}

module.exports = { generateAllPuzzles, sanitizeForClient };
