// bomb-ui.js
// プレイヤーA（爆弾担当）の操作画面
// 四角い筐体に 4 つのモジュール（wire/code/morse/button）を 2x2 で配置

const BombUI = (() => {
  const COLOR_HEX = {
    RED: "#e63946", BLUE: "#2196f3", YELLOW: "#ffc107",
    WHITE: "#f5f5f5", BLACK: "#212121",
  };
  const COLOR_JP = {
    RED: "赤", BLUE: "青", YELLOW: "黄", WHITE: "白", BLACK: "黒",
  };

  // モジュールID → 表示用ラベル
  const MOD_NAME = { 1: "WIRES", 2: "KEYPAD", 3: "MORSE", 4: "BUTTON" };

  // コードモジュールの入力バッファ
  let codeBuffer = "";
  // モールスの選択チャンネル
  let morseChannel = 1;
  // ボタン押下開始時刻
  let buttonDownAt = 0;

  function randomSerial() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function render(container, data) {
    container.innerHTML = "";
    codeBuffer = "";
    morseChannel = 1;

    // --- 爆弾筐体（メタルケース） ---
    const casing = document.createElement("div");
    casing.className = "bomb-casing";

    ["tl", "tr", "bl", "br"].forEach((pos) => {
      const screw = document.createElement("div");
      screw.className = "bomb-screw " + pos;
      casing.appendChild(screw);
    });

    const serialValue = (data && data.serial) ? data.serial : randomSerial();
    const header = document.createElement("div");
    header.className = "bomb-casing-header";
    header.innerHTML = `
      <div class="bomb-display" id="bomb-display">--:--</div>
      <div class="bomb-strike-leds" id="bomb-strike-leds">
        <span class="strike-led"></span>
        <span class="strike-led"></span>
        <span class="strike-led"></span>
      </div>
      <div class="bomb-serial">SN-${serialValue}</div>
    `;
    casing.appendChild(header);

    const panel = document.createElement("div");
    panel.className = "bomb-panel";

    const puzzles = data.puzzles;
    panel.appendChild(buildWireModule(puzzles.find((p) => p.type === "wire")));
    panel.appendChild(buildCodeModule(puzzles.find((p) => p.type === "code")));
    panel.appendChild(buildMorseModule(puzzles.find((p) => p.type === "morse")));
    panel.appendChild(buildButtonModule(puzzles.find((p) => p.type === "button")));

    casing.appendChild(panel);
    container.appendChild(casing);
  }

  // ====================================================
  // モジュール1: ワイヤー（直感的に：太く / 色名大きく / scissors hover）
  // ====================================================
  function buildWireModule(puzzle) {
    const mod = moduleShell(1, "WIRE MODULE");
    const board = document.createElement("div");
    board.className = "wire-board";

    puzzle.wires.forEach((color, i) => {
      const slot = document.createElement("div");
      slot.className = "wire-slot";
      slot.dataset.index = i;
      slot.innerHTML = `
        <div class="wire-terminal">${i + 1}</div>
        <div class="wire-cable" style="--wire-color:${COLOR_HEX[color]}">
          <div class="wire-left"></div>
          <div class="wire-scissors">✂</div>
          <div class="wire-right"></div>
        </div>
        <div class="wire-color-label"
             style="color:${COLOR_HEX[color] === '#f5f5f5' ? '#aaa' : COLOR_HEX[color]}">
          ${COLOR_JP[color]}
        </div>
      `;
      slot.onclick = () => {
        if (slot.classList.contains("cut")) return;
        if (mod.classList.contains("solved")) return;
        slot.classList.add("cutting");
        Socket.send("puzzle:wire:cut", { moduleId: 1, wireIndex: i });
      };
      board.appendChild(slot);
    });

    mod.appendChild(board);
    mod.appendChild(hintEl("wire-status", "▶ 色と本数をマニュアル担当に伝えよ"));
    return mod;
  }

  // ====================================================
  // モジュール2: 4桁コードキーパッド
  // ====================================================
  function buildCodeModule(puzzle) {
    const mod = moduleShell(2, "CODE MODULE");
    const display = document.createElement("div");
    display.className = "code-display";
    display.id = "code-display-text";
    display.textContent = puzzle.display.join(" ");

    const input = document.createElement("div");
    input.className = "code-input";
    input.id = "code-input-buf";
    input.textContent = "____";

    const keypad = document.createElement("div");
    keypad.className = "code-keypad";
    for (let n = 1; n <= 9; n++) keypad.appendChild(codeKey(String(n), input));
    const clr = codeKey("CLR", input); clr.classList.add("k-clr");
    keypad.appendChild(clr);
    keypad.appendChild(codeKey("0", input));
    const ok = codeKey("OK", input); ok.classList.add("k-ok");
    keypad.appendChild(ok);

    mod.appendChild(display);
    mod.appendChild(input);
    mod.appendChild(keypad);
    mod.appendChild(hintEl("code-status", "▶ 表示の4桁をマニュアルの規則で変換して入力"));
    return mod;
  }

  function codeKey(label, inputEl) {
    const btn = document.createElement("button");
    btn.className = "code-key";
    btn.textContent = label;
    btn.onclick = (e) => {
      e.preventDefault();
      const mod = btn.closest(".bomb-module");
      if (mod && mod.classList.contains("solved")) return;
      if (label === "CLR") {
        codeBuffer = "";
      } else if (label === "OK") {
        if (codeBuffer.length === 4) {
          Socket.send("puzzle:code:submit", { value: codeBuffer });
        }
        return;
      } else {
        if (codeBuffer.length < 4) codeBuffer += label;
      }
      inputEl.textContent = codeBuffer.padEnd(4, "_");
    };
    return btn;
  }

  // ====================================================
  // モジュール3: モールス（パターン点滅 + チャンネル選択）
  // ====================================================
  function buildMorseModule(puzzle) {
    const mod = moduleShell(3, "MORSE MODULE");

    const led = document.createElement("div");
    led.className = "morse-led";
    led.id = "morse-led";

    const playBtn = document.createElement("button");
    playBtn.className = "morse-play";
    playBtn.textContent = "▶ パターン再生";
    playBtn.onclick = () => playMorse(puzzle.pattern, led);

    const dial = document.createElement("div");
    dial.className = "morse-dial";
    dial.innerHTML = `
      <button class="morse-step" id="morse-dn">−</button>
      <div class="morse-ch" id="morse-ch">CH 1</div>
      <button class="morse-step" id="morse-up">+</button>
    `;
    dial.querySelector("#morse-dn").onclick = () => setMorseCh(morseChannel - 1);
    dial.querySelector("#morse-up").onclick = () => setMorseCh(morseChannel + 1);

    const submit = document.createElement("button");
    submit.className = "morse-submit";
    submit.textContent = "送信";
    submit.onclick = () => {
      if (mod.classList.contains("solved")) return;
      Socket.send("puzzle:morse:submit", { channel: morseChannel });
    };

    mod.appendChild(led);
    mod.appendChild(playBtn);
    mod.appendChild(dial);
    mod.appendChild(submit);
    mod.appendChild(hintEl("morse-status", "▶ 点滅パターンを読み取り、対応CHを選んで送信"));
    return mod;
  }

  function setMorseCh(n) {
    if (n < 1) n = 1; if (n > 5) n = 5;
    morseChannel = n;
    const el = document.getElementById("morse-ch");
    if (el) el.textContent = "CH " + n;
  }

  function playMorse(pattern, led) {
    if (led.classList.contains("playing")) return;
    led.classList.add("playing");
    const seq = [];
    pattern.forEach((p) => {
      const dur = p === "dash" ? 600 : 200;
      seq.push({ on: true, ms: dur });
      seq.push({ on: false, ms: 200 });
    });
    let t = 0;
    seq.forEach((step) => {
      setTimeout(() => {
        led.classList.toggle("on", step.on);
      }, t);
      t += step.ms;
    });
    setTimeout(() => {
      led.classList.remove("on", "playing");
    }, t + 50);
  }

  // ====================================================
  // モジュール4: ボタン（TAP or HOLD を押下時間で判定）
  // ====================================================
  function buildButtonModule(puzzle) {
    const mod = moduleShell(4, "BUTTON MODULE");

    const btn = document.createElement("button");
    btn.className = "big-button bb-" + puzzle.color.toLowerCase();
    btn.textContent = puzzle.label;
    btn.id = "big-button";

    const ring = document.createElement("div");
    ring.className = "big-button-ring";
    ring.id = "big-button-ring";

    const wrap = document.createElement("div");
    wrap.className = "big-button-wrap";
    wrap.appendChild(ring);
    wrap.appendChild(btn);

    btn.addEventListener("mousedown", () => {
      if (mod.classList.contains("solved")) return;
      buttonDownAt = Date.now();
      ring.classList.add("charging");
    });
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (mod.classList.contains("solved")) return;
      buttonDownAt = Date.now();
      ring.classList.add("charging");
    });
    const release = (e) => {
      if (e) e.preventDefault();
      if (mod.classList.contains("solved")) return;
      if (!buttonDownAt) return;
      const held = Date.now() - buttonDownAt;
      buttonDownAt = 0;
      ring.classList.remove("charging");
      const action = held >= 1200 ? "hold" : "tap";
      Socket.send("puzzle:button:release", { action });
    };
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", () => {
      if (buttonDownAt) {
        buttonDownAt = 0;
        ring.classList.remove("charging");
      }
    });
    btn.addEventListener("touchend", release);

    mod.appendChild(wrap);
    mod.appendChild(hintEl("button-status", "▶ 短く押す=TAP / 1.2秒以上長押し=HOLD"));
    return mod;
  }

  // ====================================================
  // 共通: モジュールの外側シェル
  // ====================================================
  function moduleShell(id, title) {
    const mod = document.createElement("div");
    mod.className = "bomb-module";
    mod.dataset.moduleId = id;
    mod.innerHTML = `
      <div class="bomb-module-header">
        <span class="bomb-led" data-led="${id}"></span>
        <span class="bomb-module-title">${title}</span>
      </div>
    `;
    return mod;
  }

  function hintEl(id, text) {
    const h = document.createElement("div");
    h.className = "bomb-hint";
    h.id = id;
    h.textContent = text;
    return h;
  }

  // ====================================================
  // サーバ応答ハンドラ
  // ====================================================
  function onResult(p) {
    setSolvedState(p.state && p.state.solved);

    const mod = document.querySelector(`.bomb-module[data-module-id="${p.moduleId}"]`);
    if (!mod) return;
    const hintMap = { 1: "wire-status", 2: "code-status", 3: "morse-status", 4: "button-status" };
    const hint = document.getElementById(hintMap[p.moduleId]);
    const led = document.querySelector(`[data-led="${p.moduleId}"]`);

    if (p.correct) {
      if (hint) { hint.textContent = "✓ 解除成功！"; hint.className = "bomb-hint ok"; }
      if (led) led.classList.add("led-green");
      if (p.moduleId === 1 && typeof p.wireIndex === "number") {
        const slot = mod.querySelector(`.wire-slot[data-index="${p.wireIndex}"]`);
        if (slot) { slot.classList.remove("cutting"); slot.classList.add("cut"); }
      }
    } else {
      if (hint) {
        const msg = p.moduleId === 1 ? "✗ 違うワイヤーだった！" :
                    p.moduleId === 2 ? "✗ コードが違う" :
                    p.moduleId === 3 ? "✗ チャンネルが違う" :
                                       "✗ ボタン操作が違う";
        hint.textContent = msg + "（ミス +1）";
        hint.className = "bomb-hint ng";
      }
      if (p.moduleId === 1 && typeof p.wireIndex === "number") {
        const slot = mod.querySelector(`.wire-slot[data-index="${p.wireIndex}"]`);
        if (slot) { slot.classList.remove("cutting"); slot.classList.add("cut", "wrong"); }
      }
      if (p.moduleId === 2) {
        codeBuffer = "";
        const buf = document.getElementById("code-input-buf");
        if (buf) buf.textContent = "____";
      }
      const gs = document.getElementById("game-screen");
      if (gs) { gs.classList.add("shake"); setTimeout(() => gs.classList.remove("shake"), 400); }
    }
  }

  // モジュールの解除状態（[bool, bool, bool, bool] 並びは puzzles 配列順 = id 順）
  function setSolvedState(solved) {
    if (!solved) return;
    [1, 2, 3, 4].forEach((id, i) => {
      const mod = document.querySelector(`.bomb-module[data-module-id="${id}"]`);
      if (!mod) return;
      if (solved[i]) {
        mod.classList.add("solved");
        const led = mod.querySelector(`[data-led="${id}"]`);
        if (led) led.classList.add("led-green");
      }
    });
  }

  // HUDの値を筐体内ディスプレイ/ミスLEDにミラー表示 + 解除状態反映
  function syncCasingHud(state) {
    if (!state) return;
    const disp = document.getElementById("bomb-display");
    if (disp) {
      const m = String(Math.floor(state.timeLeft / 60)).padStart(2, "0");
      const s = String(state.timeLeft % 60).padStart(2, "0");
      disp.textContent = `${m}:${s}`;
      disp.classList.toggle("danger", state.timeLeft <= 30);
    }
    const leds = document.querySelectorAll("#bomb-strike-leds .strike-led");
    leds.forEach((led, i) => {
      led.classList.toggle("lit", i < state.mistakes);
    });
    setSolvedState(state.solved);
  }

  return { render, onResult, syncCasingHud };
})();
