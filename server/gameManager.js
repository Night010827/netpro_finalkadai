// gameManager.js
// ゲーム進行の状態管理: 解除状況・ミスカウント・タイマー
// roomManager から gameState を受け取り、ルーム単位で進行を管理する

const MAX_MISTAKES = 3;
const TIME_LIMIT = 300; // 秒

// ゲーム状態を初期化してルームに格納する
function initGame(room, puzzleData) {
  room.gameState = {
    puzzles: puzzleData.puzzles,
    serialOdd: puzzleData.serialOdd,
    solved: [false, false, false, false], // モジュール4つの解除状況
    mistakes: 0,
    timeLeft: TIME_LIMIT,
    finished: false,
    timer: null, // setInterval のハンドル
  };
  return room.gameState;
}

// サーバー駆動のカウントダウンを開始する
// onTick(state): 毎秒呼ばれる（全員に状態を同期する用）
// onTimeout(): 時間切れになったとき呼ばれる
function startTimer(room, onTick, onTimeout) {
  const gs = room.gameState;
  if (gs.timer) clearInterval(gs.timer);

  gs.timer = setInterval(() => {
    if (gs.finished) {
      clearInterval(gs.timer);
      gs.timer = null;
      return;
    }
    gs.timeLeft -= 1;

    if (gs.timeLeft <= 0) {
      gs.timeLeft = 0;
      gs.finished = true;
      clearInterval(gs.timer);
      gs.timer = null;
      onTick(publicState(room));
      onTimeout();
    } else {
      onTick(publicState(room));
    }
  }, 1000);
}

// タイマーを停止する（クリア・ゲームオーバー・切断時）
function stopTimer(room) {
  const gs = room.gameState;
  if (gs && gs.timer) {
    clearInterval(gs.timer);
    gs.timer = null;
  }
}

// モジュールを解除済みにする
function markSolved(room, moduleId) {
  const gs = room.gameState;
  const idx = gs.puzzles.findIndex((p) => p.id === moduleId);
  if (idx !== -1) gs.solved[idx] = true;
}

// 全モジュール解除済みか
function isCleared(room) {
  return room.gameState.solved.every((s) => s === true);
}

// ミスを1加算する。上限に達したらtrueを返す（=ゲームオーバー）
function addMistake(room) {
  const gs = room.gameState;
  gs.mistakes += 1;
  return gs.mistakes >= MAX_MISTAKES;
}

// クライアントに送る公開用の状態（correctIndexなど答えは含めない）
function publicState(room) {
  const gs = room.gameState;
  return {
    solved: gs.solved,
    mistakes: gs.mistakes,
    maxMistakes: MAX_MISTAKES,
    timeLeft: gs.timeLeft,
  };
}

module.exports = {
  initGame,
  startTimer,
  stopTimer,
  markSolved,
  isCleared,
  addMistake,
  publicState,
  MAX_MISTAKES,
  TIME_LIMIT,
};
