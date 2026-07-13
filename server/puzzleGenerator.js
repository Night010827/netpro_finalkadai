// puzzleGenerator.js
// 4つのパズルモジュールを生成する

const wire = require("./puzzles/wire");
const code = require("./puzzles/code");
const morse = require("./puzzles/morse");
const simon = require("./puzzles/simon");

function rand(n) {
  return Math.floor(Math.random() * n);
}

// 爆弾側（プレイヤーA）にのみ見える機体シリアル。末尾は必ず数字にして奇偶を確定させる。
function randomSerial() {
  const alnum = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += alnum[rand(alnum.length)];
  s += String(rand(10)); // 最後の1文字は必ず数字
  return s;
}

function generateAllPuzzles() {
  const serial = randomSerial();
  const serialOdd = Number(serial[serial.length - 1]) % 2 === 1;
  return {
    puzzles: [
      wire.generate(serialOdd),
      code.generate(serialOdd),
      morse.generate(),
      simon.generate(serialOdd),
    ],
    serial,
    serialOdd,
  };
}

// クライアントA（爆弾担当）に送る用：答えは除くが、機体シリアルは実物として見せる
function sanitizeForClient(puzzleData) {
  const stripped = puzzleData.puzzles.map((p) => {
    const copy = { ...p };
    delete copy.correctIndex;    // wire
    delete copy.answer;          // code / simon
    delete copy.correctChannel;  // morse
    return copy;
  });
  return { puzzles: stripped, serial: puzzleData.serial };
}

// クライアントB（マニュアル担当）に送る用：シリアルは伏せる（Aから伝えてもらう情報のため）
function sanitizeForManual(puzzleData) {
  return { puzzles: puzzleData.puzzles };
}

module.exports = { generateAllPuzzles, sanitizeForClient, sanitizeForManual };
