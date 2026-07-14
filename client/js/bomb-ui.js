// bomb-ui.js
// プレイヤーA（爆弾担当）の操作画面 — Three.js フル3D版
// 1つの大きな爆弾ボックスの前面に 4 つのギミック（wire/code/morse/button）を 2x2 で埋め込む。
// ロジック（Socket 送信・判定）は従来と同じ。見た目のみ3D化。

const BombUI = (() => {
  const COLOR_INT = {
    RED: 0xe63946, BLUE: 0x2196f3, YELLOW: 0xffc107, WHITE: 0xf5f5f5, BLACK: 0x2b2b2b,
  };
  const COLOR_JP = { RED: "赤", BLUE: "青", YELLOW: "黄", WHITE: "白", BLACK: "黒" };
  const COLOR_LABEL_FG = {
    RED: "#ff8a92", BLUE: "#8ec6ff", YELLOW: "#ffdd66", WHITE: "#eeeeee", BLACK: "#bbbbbb",
  };
  // Simon 用（GREEN を含む4色）
  const SIMON_INT = { RED: 0xe63946, GREEN: 0x39c15a, BLUE: 0x2196f3, YELLOW: 0xffc107 };
  const SIMON_DIM = { RED: 0x5a1a20, GREEN: 0x184f27, BLUE: 0x123a5e, YELLOW: 0x6a5410 };
  const SIMON_ORDER = ["RED", "GREEN", "BLUE", "YELLOW"];

  // ---- 位置定数 ----
  const FRONT = 0.8;      // 箱前面のz
  const PLATE_Z = 0.82;   // ベイ（へこみ板）
  const EL_Z = 0.96;      // ギミック要素

  // 状態
  let codeBuffer = "";
  let morseChannel = 1;
  let simonInput = [];    // Simon で押した色の並び
  let mods = {};          // { id: { solved, meshes:[], setStatus } }

  // Three.js
  let renderer, scene, camera, controls, raycaster, mouse, animId, mountEl;
  let interactive = [];   // クリック対象メッシュ
  let anims = [];         // 毎フレーム更新するアニメーション
  let pointerDown = null; // ドラッグ/タップ判別用

  function randomSerial() {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = ""; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // =========================================================
  // エントリ
  // =========================================================
  function render(container, data) {
    disposeScene();
    container.innerHTML = "";
    codeBuffer = ""; morseChannel = 1; simonInput = []; mods = {};

    const casing = document.createElement("div");
    casing.className = "bomb-casing";

    const serial = (data && data.serial) ? data.serial : randomSerial();
    const header = document.createElement("div");
    header.className = "bomb-casing-header";
    header.innerHTML = `
      <div class="bomb-display" id="bomb-display">--:--</div>
      <div class="bomb-strike-leds" id="bomb-strike-leds">
        <span class="strike-led"></span><span class="strike-led"></span><span class="strike-led"></span>
      </div>
      <div class="bomb-serial">SN-${serial}</div>`;
    casing.appendChild(header);

    const mount = document.createElement("div");
    mount.className = "bomb-3d";
    mount.id = "bomb-3d";
    casing.appendChild(mount);

    const hint = document.createElement("div");
    hint.className = "bomb-hint";
    hint.id = "bomb-hint-line";
    hint.textContent = " ▶ 各ギミックをクリックで操作";
    casing.appendChild(hint);

    container.appendChild(casing);

    init3D(mount, data.puzzles);
  }

  function setLine(text, cls) {
    const el = document.getElementById("bomb-hint-line");
    if (el) { el.textContent = text; el.className = "bomb-hint" + (cls ? " " + cls : ""); }
  }

  // =========================================================
  // シーン初期化
  // =========================================================
  function init3D(mount, puzzles) {
    mountEl = mount;
    const w = mount.clientWidth || 700, h = mount.clientHeight || 520;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);

    camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0, 7.7);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2a30, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(5, 6, 8); scene.add(key);
    const fill = new THREE.DirectionalLight(0x99bbff, 0.5); fill.position.set(-6, -2, 5); scene.add(fill);

    // 爆弾本体（金属だが環境マップ無しのため metalness は控えめに）
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 4.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x55565c, metalness: 0.35, roughness: 0.55 })
    );
    scene.add(box);

    // 前面プレート
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(6.3, 4.5, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x44454b, metalness: 0.3, roughness: 0.6 })
    );
    face.position.z = FRONT - 0.02; scene.add(face);

    // 四隅ネジ
    const sg = new THREE.CylinderGeometry(0.13, 0.13, 0.08, 14);
    const sm = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, metalness: 1, roughness: 0.3 });
    [[-3.0, 2.1], [3.0, 2.1], [-3.0, -2.1], [3.0, -2.1]].forEach(([x, y]) => {
      const s = new THREE.Mesh(sg, sm); s.rotation.x = Math.PI / 2; s.position.set(x, y, FRONT); scene.add(s);
    });

    // ベイを仕切る金属クロス（十字の桟）
    const railMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.7, roughness: 0.5 });
    const vRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.4, 0.14), railMat);
    vRail.position.set(0, 0, FRONT + 0.02); scene.add(vRail);
    const hRail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 0.14), railMat);
    hRail.position.set(0, 0, FRONT + 0.02); scene.add(hRail);

    // 外周ベゼル枠
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.75, roughness: 0.45 });
    [[0, 2.28, 6.5, 0.16], [0, -2.28, 6.5, 0.16], [-3.22, 0, 0.16, 4.7], [3.22, 0, 0.16, 4.7]].forEach(([x, y, w, h]) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), frameMat);
      bar.position.set(x, y, FRONT); scene.add(bar);
    });

    // 側面パイプ（装置っぽさ）
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.9, roughness: 0.35 });
    [-3.05, 3.05].forEach((x) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.2, 12), pipeMat);
      pipe.position.set(x, 0, FRONT + 0.05); scene.add(pipe);
    });

    // 点滅する稼働ステータスLED（装飾・アニメ）
    const statusLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2020, emissiveIntensity: 1 })
    );
    statusLed.position.set(2.85, 2.28, FRONT + 0.12); scene.add(statusLed);
    anims.push({ kind: "blink", mesh: statusLed, t: 0 });

    // 各ギミックを2x2ベイに配置
    const bays = {
      1: [-1.62, 1.08], 2: [1.62, 1.08], 3: [-1.62, -1.08], 4: [1.62, -1.08],
    };
    buildWireBay(bays[1], puzzles.find((p) => p.type === "wire"));
    buildCodeBay(bays[2], puzzles.find((p) => p.type === "code"));
    buildMorseBay(bays[3], puzzles.find((p) => p.type === "morse"));
    buildSimonBay(bays[4], puzzles.find((p) => p.type === "simon"));

    // 回転は使わず固定正面ビュー（ギミックを確実にクリックできるように）
    controls = null;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onResize);

    animate();
  }

  // ---- ベイ共通: へこみ板 + タイトル ----
  function makeBay(center, title, id) {
    const [cx, cy] = center;
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(2.95, 2.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x14180f, metalness: 0.3, roughness: 0.85 })
    );
    plate.position.set(cx, cy, PLATE_Z);
    scene.add(plate);
    // タイトル
    const t = makeLabel(title, 1.6, 0.26, { fg: "#9fd48a", size: 150, font: "monospace" });
    t.mesh.position.set(cx, cy + 0.9, EL_Z);
    scene.add(t.mesh);
    mods[id] = { solved: false, meshes: [], plate, title: t, titleText: title, center };
    return { cx, cy };
  }

  function registerInteractive(mesh, kind, moduleId, extra) {
    mesh.userData = Object.assign({ kind, moduleId }, extra || {});
    scene.add(mesh);              // ← シーンに追加（表示＆レイキャスト対象にする）
    interactive.push(mesh);
    if (mods[moduleId]) mods[moduleId].meshes.push(mesh);
    return mesh;
  }

  // =========================================================
  // モジュール1: ワイヤー
  // =========================================================
  function buildWireBay(center, puzzle) {
    const { cx, cy } = makeBay(center, "WIRES", 1);
    const n = puzzle.wires.length;
    const spacing = 1.45 / n;
    const startY = cy + ((n - 1) * spacing) / 2 - 0.02;
    const radius = Math.min(0.09, spacing * 0.28);
    const leftX = cx - 1.05, rightX = cx + 0.95;

    // 左端子は上から順(0..n-1)、右端子は同じ高さ集合をシャッフル → 交差して絡まる
    const ys = [];
    for (let i = 0; i < n; i++) ys.push(startY - i * spacing);
    const rightYs = shuffle(ys.slice());

    puzzle.wires.forEach((color, i) => {
      const yL = ys[i], yR = rightYs[i];
      // 制御点で3Dに波打たせる（前後・上下に膨らませて絡まった見た目に）
      const zj = 0.1 + Math.random() * 0.18;
      const midY1 = yL * 0.55 + yR * 0.45 + (Math.random() - 0.5) * spacing * 1.6;
      const midY2 = yL * 0.4 + yR * 0.6 + (Math.random() - 0.5) * spacing * 1.6;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(leftX, yL, EL_Z),
        new THREE.Vector3(cx - 0.5, midY1, EL_Z + zj),
        new THREE.Vector3(cx + 0.2, midY2, EL_Z + zj * 0.7),
        new THREE.Vector3(rightX, yR, EL_Z),
      ]);
      const geo = new THREE.TubeGeometry(curve, 40, radius, 10, false);
      const wire = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: COLOR_INT[color], metalness: 0.0, roughness: 0.45, transparent: true, opacity: 1,
      }));
      registerInteractive(wire, "wire", 1, { index: i, color, cut: false });

      // 端子（左右）
      const capGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 14); capGeo.rotateZ(Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6, roughness: 0.4 });
      const capL = new THREE.Mesh(capGeo, capMat); capL.position.set(leftX, yL, EL_Z); scene.add(capL);
      const capR = new THREE.Mesh(capGeo, capMat); capR.position.set(rightX, yR, EL_Z); scene.add(capR);

      // 左端子の番号＋色ラベル（識別用）
      const num = makeLabel(String(i + 1), 0.26, Math.min(0.3, spacing * 0.9),
        { fg: "#fff", size: 150, font: "monospace" });
      num.mesh.position.set(leftX - 0.28, yL, EL_Z + 0.05); scene.add(num.mesh);
      const lab = makeLabel(COLOR_JP[color], 0.3, Math.min(0.3, spacing * 0.9),
        { fg: COLOR_LABEL_FG[color], size: 140, font: "sans-serif" });
      lab.mesh.position.set(rightX + 0.28, yR, EL_Z + 0.05); scene.add(lab.mesh);
    });
  }

  function cutWire3D(index, wrong) {
    const w = interactive.find((m) => m.userData.kind === "wire" && m.userData.index === index);
    if (!w || w.userData.cut) return;
    w.userData.cut = true;
    if (wrong) {
      w.material.color.multiplyScalar(0.35);
      w.material.opacity = 0.45;
    } else {
      w.material.emissive = new THREE.Color(0x2a7a3a);
      w.material.opacity = 0.6;
    }
  }

  // =========================================================
  // モジュール2: コードキーパッド
  // =========================================================
  function buildCodeBay(center, puzzle) {
    const { cx, cy } = makeBay(center, "KEYPAD", 2);

    // 表示（お題）
    const disp = makeLabel(puzzle.display.join(" "), 2.4, 0.34,
      { bg: "#1a1208", fg: "#ffb84d", size: 170, font: "monospace" });
    disp.mesh.position.set(cx, cy + 0.56, EL_Z); scene.add(disp.mesh);

    // 入力バッファ
    const buf = makeLabel("____", 1.7, 0.3, { bg: "#081208", fg: "#6fdf8f", size: 150, font: "monospace" });
    buf.mesh.position.set(cx, cy + 0.26, EL_Z); scene.add(buf.mesh);
    mods[2].buf = buf;

    // 3x4 キーパッド（ベイ下半分に収める）
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "OK"];
    const kw = 0.6, kh = 0.22, gx = 0.08, gy = 0.04;
    const gridW = 3 * kw + 2 * gx;
    const x0 = cx - gridW / 2 + kw / 2;
    const y0 = cy - 0.02;
    keys.forEach((k, idx) => {
      const col = idx % 3, row = Math.floor(idx / 3);
      const x = x0 + col * (kw + gx);
      const y = y0 - row * (kh + gy);
      const col3 = k === "OK" ? 0x2e8b3a : k === "CLR" ? 0x9a3030 : 0x4a4a52;
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(kw, kh, 0.16),
        new THREE.MeshStandardMaterial({ color: col3, metalness: 0.05, roughness: 0.6 })
      );
      key.position.set(x, y, EL_Z);
      registerInteractive(key, "key", 2, { label: k, baseZ: EL_Z });
      const lab = makeLabel(k, kw * 0.85, kh * 0.85, { fg: "#fff", size: 130, font: "monospace" });
      lab.mesh.position.set(x, y, EL_Z + 0.1); scene.add(lab.mesh);
      key.userData.lab = lab.mesh;
    });
  }

  function pressKey(key) {
    if (mods[2].solved) return;
    const label = key.userData.label;
    anims.push({ mesh: key, extra: key.userData.lab, t: 0, kind: "press", baseZ: key.userData.baseZ });
    if (label === "CLR") codeBuffer = "";
    else if (label === "OK") {
      if (codeBuffer.length === 4) Socket.send("puzzle:code:submit", { value: codeBuffer });
      return;
    } else if (codeBuffer.length < 4) codeBuffer += label;
    mods[2].buf.draw(codeBuffer.padEnd(4, "_"));
  }

  // =========================================================
  // モジュール3: モールス
  // =========================================================
  function buildMorseBay(center, puzzle) {
    const { cx, cy } = makeBay(center, "MORSE", 3);

    // LEDの金属ベゼル（土台）
    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.4, 0.12, 28),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.35 })
    );
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(cx, cy + 0.4, EL_Z - 0.02); scene.add(bezel);
    // 黒いリング内側
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.14, 28),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.2, roughness: 0.8 })
    );
    socket.rotation.x = Math.PI / 2;
    socket.position.set(cx, cy + 0.4, EL_Z); scene.add(socket);
    // LED（ガラス球）
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0x3a1a1a, emissive: 0x000000, roughness: 0.25, metalness: 0.0 })
    );
    led.position.set(cx, cy + 0.42, EL_Z + 0.08); scene.add(led);
    mods[3].led = led;

    // 再生ボタン
    const play = flatButton(cx, cy - 0.16, 1.9, 0.3, 0x2f3e2f, "▶ 再生");
    registerInteractive(play, "morse-play", 3, { pattern: puzzle.pattern });

    // CH ダイアル: [-] CHn [+]
    const dn = flatButton(cx - 0.85, cy - 0.56, 0.4, 0.4, 0x444444, "−");
    registerInteractive(dn, "morse-dn", 3);
    const chLabel = makeLabel("CH 1", 0.9, 0.36, { bg: "#1a0a08", fg: "#ff8a4d", size: 130, font: "monospace" });
    chLabel.mesh.position.set(cx, cy - 0.56, EL_Z + 0.02); scene.add(chLabel.mesh);
    mods[3].ch = chLabel;
    const up = flatButton(cx + 0.85, cy - 0.56, 0.4, 0.4, 0x444444, "＋");
    registerInteractive(up, "morse-up", 3);

    // 送信
    const sub = flatButton(cx, cy - 0.92, 1.8, 0.3, 0x1b5e25, "送信");
    registerInteractive(sub, "morse-submit", 3);
  }

  function setMorseCh(n) {
    if (n < 1) n = 1; if (n > 5) n = 5;
    morseChannel = n;
    if (mods[3].ch) mods[3].ch.draw("CH " + n);
  }

  function playMorse(pattern) {
    const led = mods[3].led;
    if (!led || led.userData.playing) return;
    led.userData.playing = true;
    const seq = [];
    pattern.forEach((p) => { seq.push({ on: true, ms: p === "dash" ? 600 : 200 }); seq.push({ on: false, ms: 200 }); });
    let t = 0;
    seq.forEach((step) => {
      setTimeout(() => {
        led.material.emissive.setHex(step.on ? 0xffe040 : 0x000000);
        led.material.color.setHex(step.on ? 0xffee88 : 0x3a1a1a);
      }, t);
      t += step.ms;
    });
    setTimeout(() => {
      led.material.emissive.setHex(0x000000); led.material.color.setHex(0x3a1a1a);
      led.userData.playing = false;
    }, t + 50);
  }

  // =========================================================
  // モジュール4: サイモン（記憶ゲーム）
  // =========================================================
  function buildSimonBay(center, puzzle) {
    const { cx, cy } = makeBay(center, "SIMON", 4);
    mods[4].seq = puzzle.sequence || [];
    mods[4].buttons = {};

    // 進捗表示
    const prog = makeLabel("入力 0/" + mods[4].seq.length, 1.7, 0.26,
      { bg: "#0a0f14", fg: "#7fd4ff", size: 110, font: "monospace" });
    prog.mesh.position.set(cx, cy + 0.66, EL_Z); scene.add(prog.mesh);
    mods[4].prog = prog;

    // 4色ボタン（2x2）
    const pos = {
      RED: [cx - 0.45, cy + 0.16], GREEN: [cx + 0.45, cy + 0.16],
      BLUE: [cx - 0.45, cy - 0.36], YELLOW: [cx + 0.45, cy - 0.36],
    };
    SIMON_ORDER.forEach((col) => {
      const [x, y] = pos[col];
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.32, 0.16, 28),
        new THREE.MeshStandardMaterial({ color: SIMON_DIM[col], emissive: 0x000000, metalness: 0.1, roughness: 0.5 })
      );
      b.rotation.x = Math.PI / 2;
      b.position.set(x, y, EL_Z);
      registerInteractive(b, "simon-color", 4, { color: col });
      mods[4].buttons[col] = b;
    });

    // 下段: 再生 / やり直し / 送信（横一列）
    const rowY = cy - 0.84;
    const play = flatButton(cx - 0.95, rowY, 0.9, 0.28, 0x2f3e2f, "▶再生");
    registerInteractive(play, "simon-play", 4);
    const reset = flatButton(cx, rowY, 0.5, 0.28, 0x5a3a1f, "↺");
    registerInteractive(reset, "simon-reset", 4);
    const sub = flatButton(cx + 0.9, rowY, 0.9, 0.28, 0x1b5e25, "送信");
    registerInteractive(sub, "simon-submit", 4);
  }

  // 単色ボタンを一瞬光らせる
  function flashSimon(col, ms) {
    const b = mods[4] && mods[4].buttons && mods[4].buttons[col];
    if (!b) return;
    b.material.color.setHex(SIMON_INT[col]);
    b.material.emissive.setHex(SIMON_INT[col]);
    setTimeout(() => {
      b.material.color.setHex(SIMON_DIM[col]);
      b.material.emissive.setHex(0x000000);
    }, ms || 320);
  }

  function playSimonSequence() {
    const seq = mods[4].seq || [];
    if (mods[4].playing) return;
    mods[4].playing = true;
    let t = 0;
    seq.forEach((col) => {
      setTimeout(() => flashSimon(col, 380), t);
      t += 560;
    });
    setTimeout(() => { mods[4].playing = false; }, t + 50);
  }

  function simonPress(col) {
    if (mods[4].solved || mods[4].playing) return;
    if (simonInput.length >= mods[4].seq.length) return;
    flashSimon(col, 260);
    simonInput.push(col);
    if (mods[4].prog) mods[4].prog.draw("入力 " + simonInput.length + "/" + mods[4].seq.length);
  }

  function simonReset() {
    simonInput = [];
    if (mods[4].prog) mods[4].prog.draw("入力 0/" + mods[4].seq.length);
  }

  // 平たいボタン生成（ラベル付き）
  function flatButton(x, y, w, h, color, text) {
    const btn = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.12),
      new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.6 })
    );
    btn.position.set(x, y, EL_Z);
    const lab = makeLabel(text, w * 0.9, h * 0.75, { fg: "#eee", size: 100, font: "sans-serif" });
    lab.mesh.position.set(x, y, EL_Z + 0.07); scene.add(lab.mesh);
    btn.userData.lab = lab.mesh;
    return btn;
  }

  // =========================================================
  // ポインタ操作（タップ/ドラッグ判別）
  // =========================================================
  function raycastAt(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactive);
    return hits.length ? hits[0].object : null;
  }

  function onPointerDown(e) {
    const obj = raycastAt(e);
    pointerDown = { obj, x: e.clientX, y: e.clientY, t: Date.now() };
  }

  function onPointerUp(e) {
    const start = pointerDown; pointerDown = null;
    if (!start) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (moved > 10) return; // 大きく動いた＝誤操作とみなす
    const obj = raycastAt(e);
    if (!obj || obj !== start.obj) return;
    dispatch(obj);
  }

  function dispatch(obj) {
    const u = obj.userData;
    switch (u.kind) {
      case "wire":
        if (u.cut || mods[1].solved) return;
        Socket.send("puzzle:wire:cut", { moduleId: 1, wireIndex: u.index });
        break;
      case "key": pressKey(obj); break;
      case "morse-play": playMorse(u.pattern); break;
      case "morse-dn": setMorseCh(morseChannel - 1); break;
      case "morse-up": setMorseCh(morseChannel + 1); break;
      case "morse-submit":
        if (mods[3].solved) return;
        Socket.send("puzzle:morse:submit", { channel: morseChannel });
        break;
      case "simon-color": simonPress(u.color); break;
      case "simon-play": playSimonSequence(); break;
      case "simon-reset": simonReset(); break;
      case "simon-submit":
        if (mods[4].solved) return;
        if (simonInput.length !== mods[4].seq.length) { setLine("▶ サイモン: " + mods[4].seq.length + "色ぶん入力してから送信", "ng"); return; }
        Socket.send("puzzle:simon:submit", { sequence: simonInput.slice() });
        break;
    }
  }

  // =========================================================
  // ループ / リサイズ / 破棄
  // =========================================================
  function animate() {
    animId = requestAnimationFrame(animate);
    anims = anims.filter((a) => {
      if (a.kind === "blink") {
        a.t += 0.03;
        const on = (Math.sin(a.t * 3) > 0);
        a.mesh.material.emissiveIntensity = on ? 1.2 : 0.15;
        return true; // 永続
      }
      a.t = Math.min(1, a.t + 0.15);
      if (a.kind === "press") {
        const dz = Math.sin(a.t * Math.PI) * 0.08;
        a.mesh.position.z = a.baseZ - dz;
        if (a.extra) a.extra.position.z = a.baseZ + 0.1 - dz;
      }
      return a.t < 1;
    });
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
  }

  function onResize() {
    if (!renderer || !mountEl) return;
    const w = mountEl.clientWidth, h = mountEl.clientHeight || 520;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function disposeScene() {
    if (animId) cancelAnimationFrame(animId); animId = null;
    window.removeEventListener("resize", onResize);
    if (renderer) {
      const dom = renderer.domElement;
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    }
    renderer = scene = camera = controls = raycaster = null;
    interactive = []; anims = []; pointerDown = null; mountEl = null;
  }

  // =========================================================
  // テクスチャ文字ヘルパ
  // =========================================================
  function makeLabel(text, planeW, planeH, opt) {
    opt = opt || {};
    const px = 256, ar = planeW / planeH;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(64, Math.round(px * ar)); canvas.height = px;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    const api = {
      canvas, ctx, tex,
      draw(t) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (opt.bg) { ctx.fillStyle = opt.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.fillStyle = opt.fg || "#fff";
        ctx.font = `bold ${opt.size || 130}px ${opt.font || "monospace"}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t, canvas.width / 2, canvas.height / 2 + 6);
        tex.needsUpdate = true;
      },
    };
    api.draw(text);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: !opt.bg });
    api.mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat);
    return api;
  }

  // =========================================================
  // サーバ応答
  // =========================================================
  function onResult(p) {
    setSolvedState(p.state && p.state.solved);

    if (p.moduleId === 1) {
      cutWire3D(p.wireIndex, !p.correct);
      p.correct ? setLine("✓ ワイヤー解除成功！", "ok")
                : (setLine("✗ 違うワイヤーだった！（ミス +1）", "ng"), shake());
      return;
    }
    if (p.correct) {
      setLine("✓ モジュール解除成功！", "ok");
    } else {
      const msg = p.moduleId === 2 ? "✗ コードが違う" : p.moduleId === 3 ? "✗ チャンネルが違う" : "✗ 順番が違う";
      setLine(msg + "（ミス +1）", "ng");
      if (p.moduleId === 2) { codeBuffer = ""; if (mods[2].buf) mods[2].buf.draw("____"); }
      if (p.moduleId === 4) { simonReset(); }
      shake();
    }
  }

  function shake() {
    const gs = document.getElementById("game-screen");
    if (gs) { gs.classList.add("shake"); setTimeout(() => gs.classList.remove("shake"), 400); }
  }

  // 解除状態 [wire, code, morse, button]
  function setSolvedState(solved) {
    if (!solved) return;
    [1, 2, 3, 4].forEach((id) => {
      if (solved[id - 1] && mods[id] && !mods[id].solved) markSolved(id);
    });
  }

  function markSolved(id) {
    const m = mods[id];
    m.solved = true;
    if (m.plate) m.plate.material.color.setHex(0x0f2a12);
    if (m.title) m.title.draw("✓ " + m.titleText);
  }

  function syncCasingHud(state) {
    if (!state) return;
    const disp = document.getElementById("bomb-display");
    if (disp) {
      const mm = String(Math.floor(state.timeLeft / 60)).padStart(2, "0");
      const ss = String(state.timeLeft % 60).padStart(2, "0");
      disp.textContent = `${mm}:${ss}`;
      disp.classList.toggle("danger", state.timeLeft <= 30);
    }
    document.querySelectorAll("#bomb-strike-leds .strike-led").forEach((led, i) => {
      led.classList.toggle("lit", i < state.mistakes);
    });
    setSolvedState(state.solved);
  }

  return { render, onResult, syncCasingHud };
})();
