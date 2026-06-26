// socket.js
// クライアント側のWebSocket通信を一元管理するモジュール

const Socket = (() => {
  let ws = null;
  const handlers = {}; // type -> コールバック関数

  // サーバーに接続
  function connect() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}`);

    ws.onopen = () => console.log("サーバー接続完了");
    ws.onclose = () => console.log("サーバー切断");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // 登録されたハンドラがあれば呼び出す
      if (handlers[msg.type]) handlers[msg.type](msg.payload);
    };
  }

  // メッセージ送信
  function send(type, payload = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  // 特定のメッセージ種別に対するハンドラを登録
  function on(type, callback) {
    handlers[type] = callback;
  }

  return { connect, send, on };
})();
