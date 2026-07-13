// server.js
// WebSocket サーバーのエントリポイント
// 接続管理・メッセージ振り分けを担当する

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const WebSocket = require("ws");
const roomManager = require("./roomManager");
const gameManager = require("./gameManager");
const { generateAllPuzzles, sanitizeForClient, sanitizeForManual } = require("./puzzleGenerator");
const wire = require("./puzzles/wire");
const code = require("./puzzles/code");
const morse = require("./puzzles/morse");
const simon = require("./puzzles/simon");

const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const CLIENT_DIR = path.join(__dirname, "..", "client");

function getLocalNetworkUrls(port) {
  const urls = [];
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).forEach((addresses) => {
    addresses
      .filter((addr) => addr.family === "IPv4" && !addr.internal)
      .forEach((addr) => urls.push(`http://${addr.address}:${port}`));
  });
  return urls;
}

// --- 静的ファイル配信 ---
const server = http.createServer((req, res) => {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(CLIENT_DIR, filePath.split("?")[0]);

  const ext = path.extname(filePath);
  const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[ext] || "text/plain",
      // 開発中に古いJS/CSSがキャッシュされ続けるのを防ぐ
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(content);
  });
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("クライアント接続");
  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    handleMessage(ws, msg);
  });
  ws.on("close", () => {
    console.log("クライアント切断");
    const room = roomManager.getRoom(ws.roomId);
    if (room && room.gameState) gameManager.stopTimer(room);
    roomManager.leaveRoom(ws);
  });
});

function handleMessage(ws, msg) {
  switch (msg.type) {
    case "room:create": {
      const room = roomManager.createRoom(ws);
      ws.send(JSON.stringify({ type: "room:created", payload: { roomId: room.roomId } }));
      break;
    }

    case "room:join": {
      const result = roomManager.joinRoom(msg.payload.roomId, ws);
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", payload: { message: result.error } }));
        break;
      }
      roomManager.broadcast(msg.payload.roomId, {
        type: "room:joined",
        payload: { roomId: msg.payload.roomId, players: result.room.players.length },
      });
      break;
    }

    case "role:select": {
      const result = roomManager.selectRole(ws.roomId, ws, msg.payload.role);
      if (result.error) {
        ws.send(JSON.stringify({ type: "error", payload: { message: result.error } }));
        break;
      }
      if (roomManager.bothReady(ws.roomId)) {
        startGame(ws.roomId);
      } else {
        // 自分のロールが確定したことを本人に通知
        ws.send(JSON.stringify({ type: "role:confirmed", payload: { role: msg.payload.role } }));
      }
      break;
    }

    case "puzzle:wire:cut": {
      handlePuzzleAnswer(ws, 1, (puzzle) => wire.judge(puzzle, msg.payload.wireIndex), { wireIndex: msg.payload.wireIndex });
      break;
    }
    case "puzzle:code:submit": {
      handlePuzzleAnswer(ws, 2, (puzzle) => code.judge(puzzle, msg.payload.value), { value: msg.payload.value });
      break;
    }
    case "puzzle:morse:submit": {
      handlePuzzleAnswer(ws, 3, (puzzle) => morse.judge(puzzle, msg.payload.channel), { channel: msg.payload.channel });
      break;
    }
    case "puzzle:simon:submit": {
      handlePuzzleAnswer(ws, 4, (puzzle, room) => simon.judge(puzzle, msg.payload.sequence, room.gameState.serialOdd, room.gameState.mistakes), {});
      break;
    }

    default:
      console.log("未知のメッセージ:", msg.type);
  }
}

// --- ゲーム開始処理 ---
function startGame(roomId) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const fullPuzzles = generateAllPuzzles();   // 答え込み（サーバー保持用）
  gameManager.initGame(room, fullPuzzles);

  // 各プレイヤーに役割を伝えつつ、Aには答え抜きデータを送る
  const clientPuzzles = sanitizeForClient(fullPuzzles); // A: 答えは除くがシリアルは実物として渡す
  const manualPuzzles = sanitizeForManual(fullPuzzles); // B: 答えは渡すがシリアルは伏せる（Aから聞く情報）
  room.players.forEach((p) => {
    p.ws.send(JSON.stringify({
      type: "game:start",
      payload: {
        role: p.role,
        // A=爆弾担当には見た目データ、B=マニュアル担当には全データ（答えはマニュアルで導出するので可）
        data: p.role === "A" ? clientPuzzles : manualPuzzles,
        state: gameManager.publicState(room),
      },
    }));
  });
  console.log(`ゲーム開始 (room: ${roomId})`);

  // サーバー駆動のカウントダウンタイマーを開始
  gameManager.startTimer(
    room,
    // 毎秒: 全員に残り時間を同期
    (state) => roomManager.broadcast(roomId, { type: "game:state", payload: { state } }),
    // 時間切れ: ゲームオーバー
    () => roomManager.broadcast(roomId, { type: "game:over", payload: { reason: "timeout" } })
  );
}

// --- パズル解答の共通ハンドラ ---
function handlePuzzleAnswer(ws, moduleId, judgeFn, extraPayload) {
  const room = roomManager.getRoom(ws.roomId);
  if (!room || !room.gameState || room.gameState.finished) return;

  const puzzle = room.gameState.puzzles.find((p) => p.id === moduleId);
  if (!puzzle) return;

  // 既に解除済みのモジュールへの再応答は無視
  const idx = room.gameState.puzzles.findIndex((p) => p.id === moduleId);
  if (room.gameState.solved[idx]) return;

  const correct = judgeFn(puzzle, room);
  let gameOver = false;
  if (correct) {
    gameManager.markSolved(room, moduleId);
  } else {
    gameOver = gameManager.addMistake(room);
  }

  roomManager.broadcast(ws.roomId, {
    type: "puzzle:result",
    payload: {
      moduleId,
      correct,
      ...extraPayload,
      state: gameManager.publicState(room),
    },
  });

  if (gameOver) {
    room.gameState.finished = true;
    gameManager.stopTimer(room);
    roomManager.broadcast(ws.roomId, { type: "game:over", payload: { reason: "mistakes" } });
  } else if (gameManager.isCleared(room)) {
    room.gameState.finished = true;
    gameManager.stopTimer(room);
    roomManager.broadcast(ws.roomId, {
      type: "game:clear",
      payload: { timeLeft: room.gameState.timeLeft, mistakes: room.gameState.mistakes },
    });
  }
}

server.listen(PORT, HOST, () => {
  const networkUrls = getLocalNetworkUrls(PORT);
  console.log(`サーバー起動: http://localhost:${PORT}`);
  if (networkUrls.length > 0) {
    console.log("同じWi-Fiの別端末からアクセス:");
    networkUrls.forEach((url) => console.log(`  ${url}`));
  } else {
    console.log("LAN用IPを取得できませんでした。端末のIPアドレスを確認してください。");
  }
});
