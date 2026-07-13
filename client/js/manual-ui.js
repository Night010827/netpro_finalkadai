// manual-ui.js
// プレイヤーB（マニュアル担当）の閲覧画面UI
// 本物の取扱説明書風。意図的に情報を分散させ、読み解きを要する作りにする。

const ManualUI = (() => {
  function render(container, data) {
    container.innerHTML = "";
    // シリアル番号は解除班員（操作担当・プレイヤーA）の機体にのみ表示される。
    // マニュアル側は値を知らされないため、奇偶どちらでも判定できるよう両方を併記する。

    const book = document.createElement("div");
    book.className = "manual-book";

    book.innerHTML = `
      <div class="manual-cover">
        <div class="manual-cover-title">爆弾解除マニュアル</div>
        <div class="manual-cover-sub">BOMB DEFUSAL FIELD MANUAL — Rev. 1.0</div>
        <div class="manual-cover-warn">⚠ 取扱注意 — 解除班員以外の閲覧を禁ず</div>
      </div>

      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§0</span>
          <span class="manual-sec-name">総則（全モジュール共通の注意事項）</span>
        </div>

        <div class="manual-note">
          <span class="manual-note-tag">重要</span>
          条件表は<b>上から順に照合</b>し、<b>最初に合致した</b>項目に従うこと（§1）。
        </div>

        <div class="manual-serial">
          シリアル番号は<b>操作担当の画面にのみ表示</b>される。
          <span class="manual-serial-val">末尾の1桁</span>を確認させ、奇偶を判定すること
          <span class="manual-serial-tip">（§1・§2・§4 で使用）</span>。
          <div class="manual-warn-box">
          <b>警告</b> ── 誤判断でミスが加算され、<b>3回で起爆</b>する。確信を得てから指示せよ。
        </div>
        </div>
      </div>

      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§1</span>
          <span class="manual-sec-name">ワイヤー切断手順</span>
        </div>

        <p class="manual-lead">
          ワイヤーは <b>4〜6本</b>。操作担当に <u>本数</u> と <u>上から順の色</u> を読み上げさせ、
          下表で切断する1本を特定せよ。
        </p>

        <!-- 4本 -->
        <div class="manual-table-block">
          <div class="manual-table-cap">表 1-A ── ワイヤーが <b>4本</b> のとき</div>
          <table class="manual-table">
            <tr><th>No.</th><th>条件（上から照合）</th><th>切断するワイヤー</th></tr>
            <tr><td>①</td><td>赤色のワイヤーが <b>1本も無い</b></td><td>上から <b>2番目</b></td></tr>
            <tr><td>②</td><td>最後（最下段）のワイヤーが <b>白</b></td><td><b>最後</b>のワイヤー</td></tr>
            <tr><td>③</td><td>青色のワイヤーが <b>2本以上</b></td><td>最後の <b>青</b></td></tr>
            <tr><td>④</td><td>上記いずれにも該当しない</td><td><b>最後</b>のワイヤー</td></tr>
          </table>
        </div>

        <!-- 5本 -->
        <div class="manual-table-block">
          <div class="manual-table-cap">表 1-B ── ワイヤーが <b>5本</b> のとき</div>
          <table class="manual-table">
            <tr><th>No.</th><th>条件（上から照合）</th><th>切断するワイヤー</th></tr>
            <tr><td>①</td><td>最後が <b>黒</b> ＆ シリアル末尾が <b>奇数</b></td><td>上から <b>4番目</b></td></tr>
            <tr><td>②</td><td>赤が <b>1本</b> ＆ 黄が <b>2本以上</b></td><td>上から <b>1番目</b></td></tr>
            <tr><td>③</td><td>黒色のワイヤーが <b>1本も無い</b></td><td>上から <b>2番目</b></td></tr>
            <tr><td>④</td><td>上記いずれにも該当しない</td><td>上から <b>1番目</b></td></tr>
          </table>
          <div class="manual-margin-note">※②「赤1本」＝ちょうど1本（2本以上は非該当）。</div>
        </div>

        <!-- 6本 -->
        <div class="manual-table-block">
          <div class="manual-table-cap">表 1-C ── ワイヤーが <b>6本</b> のとき</div>
          <table class="manual-table">
            <tr><th>No.</th><th>条件（上から照合）</th><th>切断するワイヤー</th></tr>
            <tr><td>①</td><td>黄が <b>1本も無い</b> ＆ シリアル末尾が <b>奇数</b></td><td>上から <b>3番目</b></td></tr>
            <tr><td>②</td><td>黄が <b>1本</b> ＆ 白が <b>2本以上</b></td><td>上から <b>4番目</b></td></tr>
            <tr><td>③</td><td>赤色のワイヤーが <b>1本も無い</b></td><td><b>最後</b>のワイヤー</td></tr>
            <tr><td>④</td><td>上記いずれにも該当しない</td><td>上から <b>4番目</b></td></tr>
          </table>
        </div>


      </div>
    `;
    container.appendChild(book);

    // §2 コードモジュール
    const sec2 = document.createElement("div");
    sec2.className = "manual-book";
    sec2.innerHTML = `
      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§2</span>
          <span class="manual-sec-name">コードモジュール</span>
        </div>
        <p class="manual-lead">
          表示 <b>4桁</b> を読み上げさせ、次の手順で解除コードを算出せよ。
        </p>
        <div class="manual-table-block">
          <table class="manual-table">
            <tr><th>手順</th><th>操作</th></tr>
            <tr><td>Ⅰ</td><td>表示4桁を合計し、その <b>一の位</b> を <b>K</b> とする<sup>†</sup></td></tr>
            <tr><td>Ⅱ</td><td>各桁に <b>K を加算</b> し、<b>10 で割った余り</b> に置き換える</td></tr>
            <tr><td>Ⅲ</td><td>Ⅱの4桁を、<span class="manual-dim">下欄の指示</span>に従って並べる</td></tr>
          </table>
          <div class="manual-margin-note">
            <sup>†</sup> 例: 3 8 2 5 → 合計18 → K=8 → 各桁+8 mod10 = 1 6 0 3。
          </div>
        </div>
        <p class="manual-lead manual-dim">
          Ⅲの並べ方 ── シリアル末尾が<b>奇数なら逆順</b>、<b>偶数ならそのまま</b>。
          （例: 奇数→<b>3 0 6 1</b> ／ 偶数→<b>1 6 0 3</b>）
        </p>
      </div>
    `;
    container.appendChild(sec2);

    // §3 モールスモジュール
    const sec3 = document.createElement("div");
    sec3.className = "manual-book";
    sec3.innerHTML = `
      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§3</span>
          <span class="manual-sec-name">モールスモジュール</span>
        </div>
        <p class="manual-lead">
          LED点滅（短=・、長=−）を読み取らせ、下表の <b>CH番号</b> を送信させよ。
        </p>
        <div class="manual-table-block">
          <table class="manual-table">
            <tr><th>記号</th><th>モールス</th><th>選ぶCH</th></tr>
            <tr><td>U</td><td>・&nbsp;・&nbsp;−</td><td><b>CH 1</b></td></tr>
            <tr><td>D</td><td>−&nbsp;・&nbsp;・</td><td><b>CH 2</b></td></tr>
            <tr><td>R</td><td>・&nbsp;−&nbsp;・</td><td><b>CH 3</b></td></tr>
            <tr><td>G</td><td>−&nbsp;−&nbsp;・</td><td><b>CH 4</b></td></tr>
            <tr><td>H</td><td>・&nbsp;・&nbsp;・&nbsp;・</td><td><b>CH 5</b></td></tr>
          </table>
          <div class="manual-margin-note">※「−」は「・」の約3倍の長さで点灯する。</div>
        </div>
      </div>
    `;
    container.appendChild(sec3);

    // §4 サイモンモジュール
    // 変換表は「シリアル末尾の奇偶」×「現在のミス回数」で切り替わる（simon.js と対応）。
    const SIMON_MAPS_EVEN = [
      { RED: "緑", GREEN: "赤", BLUE: "黄", YELLOW: "青" },
      { RED: "黄", GREEN: "赤", BLUE: "緑", YELLOW: "青" },
      { RED: "青", GREEN: "黄", BLUE: "緑", YELLOW: "赤" },
    ];
    const SIMON_MAPS_ODD = [
      { RED: "青", GREEN: "黄", BLUE: "赤", YELLOW: "緑" },
      { RED: "緑", GREEN: "青", BLUE: "黄", YELLOW: "赤" },
      { RED: "緑", GREEN: "黄", BLUE: "赤", YELLOW: "青" },
    ];
    const SIMON_ROWS = [["RED", "赤"], ["GREEN", "緑"], ["BLUE", "青"], ["YELLOW", "黄"]];

    const sec4 = document.createElement("div");
    sec4.className = "manual-book";
    sec4.innerHTML = `
      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§4</span>
          <span class="manual-sec-name">記憶モジュール（サイモン）</span>
        </div>
        <p class="manual-lead">
          「再生」で4色が <b>一定の順</b> で点滅する。読み上げさせた色を下表で
          <b>読み替え</b>、同じ順でボタンに入力させよ
          <span class="manual-dim">（点滅色そのものは不可）</span>。
          <b>シリアル末尾の奇偶</b>と <b>ミス表示</b> を確認し、該当する表・列を用いること<sup>‡</sup>。
        </p>
        <div class="manual-table-block">
          <div class="manual-table-cap">◆ シリアル末尾が <b>奇数</b> の場合</div>
          <table class="manual-table manual-table-wide">
            <tr><th>点滅した色</th><th>ミス 0 回</th><th>ミス 1 回</th><th>ミス 2 回</th></tr>
            ${SIMON_ROWS.map(([key, label]) =>
              `<tr><td>${label}</td><td>${SIMON_MAPS_ODD[0][key]}</td><td>${SIMON_MAPS_ODD[1][key]}</td><td>${SIMON_MAPS_ODD[2][key]}</td></tr>`
            ).join("")}
          </table>
        </div>
        <div class="manual-table-block">
          <div class="manual-table-cap">◆ シリアル末尾が <b>偶数</b> の場合</div>
          <table class="manual-table manual-table-wide">
            <tr><th>点滅した色</th><th>ミス 0 回</th><th>ミス 1 回</th><th>ミス 2 回</th></tr>
            ${SIMON_ROWS.map(([key, label]) =>
              `<tr><td>${label}</td><td>${SIMON_MAPS_EVEN[0][key]}</td><td>${SIMON_MAPS_EVEN[1][key]}</td><td>${SIMON_MAPS_EVEN[2][key]}</td></tr>`
            ).join("")}
          </table>
          <div class="manual-margin-note">

          </div>
        </div>
        <div class="manual-warn-box">
          <b>警告</b> ── <b>4色すべて</b>入力してから送信させよ。誤入力時は「↺」で消して再生からやり直す。
        </div>
      </div>
    `;
    container.appendChild(sec4);
  }

  return { render };
})();
