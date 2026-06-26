// puzzles/wire.js
// モジュール1: ワイヤー切断パズルの生成と判定
// マニュアルの判定表（企画書 3章）に対応する correctIndex を算出する

const WIRE_COLORS = ["RED", "BLUE", "YELLOW", "WHITE", "BLACK"];

function rand(n) {
  return Math.floor(Math.random() * n);
}

// 指定色のワイヤー本数を数える
function count(wires, color) {
  return wires.filter((w) => w === color).length;
}

// マニュアルの判定表に基づいて「切るべきワイヤーの添字(0始まり)」を返す
// serialOdd: シリアル番号末尾が奇数か
function solve(wires, serialOdd) {
  const n = wires.length;
  const last = wires[n - 1];

  if (n === 4) {
    if (count(wires, "RED") === 0) return 1;          // 赤がない → 2番目
    if (last === "WHITE") return n - 1;               // 最後が白 → 最後
    if (count(wires, "BLUE") >= 2) {                  // 青2本以上 → 最後の青
      return wires.lastIndexOf("BLUE");
    }
    return n - 1;                                     // それ以外 → 最後
  }

  if (n === 5) {
    if (last === "BLACK" && serialOdd) return 3;      // 最後が黒かつ奇数 → 4番目
    if (count(wires, "RED") === 1 && count(wires, "YELLOW") >= 2) return 0; // 赤1黄2+ → 1番目
    if (count(wires, "BLACK") === 0) return 1;        // 黒がない → 2番目
    return 0;                                         // それ以外 → 1番目
  }

  // n === 6
  if (count(wires, "YELLOW") === 0 && serialOdd) return 2; // 黄なしかつ奇数 → 3番目
  if (count(wires, "YELLOW") === 1 && count(wires, "WHITE") >= 2) return 3; // 黄1白2+ → 4番目
  if (count(wires, "RED") === 0) return n - 1;        // 赤がない → 最後
  return 3;                                           // それ以外 → 4番目
}

// パズルデータを生成する
function generate(serialOdd) {
  const count = 4 + rand(3); // 4〜6本
  const wires = [];
  for (let i = 0; i < count; i++) {
    wires.push(WIRE_COLORS[rand(WIRE_COLORS.length)]);
  }
  const correctIndex = solve(wires, serialOdd);
  // correctIndex はサーバー内部でのみ保持し、クライアントAにはwiresだけをぶ送る
  return { id: 1, type: "wire", wires, correctIndex };
}

// 解答判定: 切ったワイヤーの添字が正解かどうか
function judge(puzzle, wireIndex) {
  return wireIndex === puzzle.correctIndex;
}

module.exports = { generate, judge, solve };
