// roomManager.js
// ルームの作成・参加・退出・状態管理を担当するモジュール

const rooms = new Map(); // roomId -> room オブジェクト

// 6桁のランダムなルームコードを生成（英数字大文字）
function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id;
  do {
    id = "";
    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(id)); // 重複しないコードになるまで再生成
  return id;
}

// ルームを新規作成し、作成者を1人目のプレイヤーとして登録
function createRoom(ws) {
  const roomId = generateRoomId();
  const room = {
    roomId,
    players: [{ ws, role: null }], // role は後でA/Bを選択
    gameState: null,               // ゲーム開始後に格納
  };
  rooms.set(roomId, room);
  ws.roomId = roomId;              // WebSocketに所属ルームを記録
  return room;
}

// 既存ルームに2人目として参加
function joinRoom(roomId, ws) {
  const room = rooms.get(roomId);
  if (!room) return { error: "ルームが見つかりません" };
  if (room.players.length >= 2) return { error: "ルームが満員です" };

  room.players.push({ ws, role: null });
  ws.roomId = roomId;
  return { room };
}

// ロール（A: 爆弾担当 / B: マニュアル担当）を選択
function selectRole(roomId, ws, role) {
  const room = rooms.get(roomId);
  if (!room) return { error: "ルームが見つかりません" };

  // 既に同じロールを他プレイヤーが選んでいないかチェック
  const taken = room.players.some((p) => p.role === role && p.ws !== ws);
  if (taken) return { error: "そのロールは既に選択されています" };

  const player = room.players.find((p) => p.ws === ws);
  if (player) player.role = role;
  return { room };
}

// 2人ともロール選択が完了したか
function bothReady(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.players.length < 2) return false;
  return room.players.every((p) => p.role !== null);
}

// ルーム内の全員にメッセージを送信
function broadcast(roomId, message) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(message);
  room.players.forEach((p) => {
    if (p.ws.readyState === 1) p.ws.send(data); // 1 = OPEN
  });
}

// 切断時にルームから退出させる
function leaveRoom(ws) {
  const roomId = ws.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter((p) => p.ws !== ws);
  // 相手に切断を通知
  broadcast(roomId, { type: "player:left", payload: {} });

  if (room.players.length === 0) {
    rooms.delete(roomId); // 誰もいなくなったらルーム削除
  }
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

module.exports = {
  createRoom,
  joinRoom,
  selectRole,
  bothReady,
  broadcast,
  leaveRoom,
  getRoom,
};
