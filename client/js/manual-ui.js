// manual-ui.js
// プレイヤーB（マニュアル担当）の閲覧画面UI
// 本物の取扱説明書風。意図的に情報を分散させ、読み解きを要する作りにする。

const ManualUI = (() => {
  function render(container, data) {
    container.innerHTML = "";
    const serialOdd = data.serialOdd;

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
          <span class="manual-sec-no">§1</span>
          <span class="manual-sec-name">ワイヤー切断手順</span>
        </div>

        <p class="manual-lead">
          本モジュールには <b>4本から6本</b> のワイヤーが接続されている。
          解除班員（操作担当）に <u>ワイヤーの総本数</u> と <u>上から順の色</u> を読み上げさせ、
          下記の判定手順に従って切断すべき1本を特定し、指示せよ。
        </p>

        <div class="manual-note">
          <span class="manual-note-tag">重要</span>
          条件は<b>上から順に</b>照合し、<b>最初に合致した</b>項目に従うこと。
          以降の条件は読まなくてよい。
        </div>

        <div class="manual-serial">
          本機体のシリアル番号末尾は
          <span class="manual-serial-val">${serialOdd ? "奇数" : "偶数"}</span>
          である。
          <span class="manual-serial-tip">（一部の判定で参照する）</span>
        </div>

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
          <div class="manual-margin-note">※②の「赤1本」とは赤がちょうど1本の意。2本以上では該当しない。</div>
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

        <div class="manual-warn-box">
          <b>警告</b> ── 誤ったワイヤーの切断は起爆カウントを進める。
          3回の誤操作で即時起爆する。確信が持てるまで切断を指示してはならない。
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
          ディスプレイに表示される <b>4桁の数字</b> を、解除班員に読み上げさせよ。
          下記の変換規則に従って <b>4桁の解除コード</b> を求め、入力させること。
        </p>
        <div class="manual-serial">
          シリアル末尾は
          <span class="manual-serial-val">${serialOdd ? "奇数" : "偶数"}</span>
          である。
        </div>
        <div class="manual-table-block">
          <table class="manual-table">
            <tr><th>シリアル末尾</th><th>変換規則</th><th>例</th></tr>
            <tr><td>奇数</td><td>表示の <b>並びを逆順</b> にした4桁</td><td>表示「1 2 3 4」→ <b>4321</b></td></tr>
            <tr><td>偶数</td><td>表示4桁の <b>合計</b>（4桁ゼロ埋め）</td><td>表示「7 8 9 6」→ 30 → <b>0030</b></td></tr>
          </table>
        </div>
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
          解除班員が再生したLED点滅パターン（短=・, 長=−）を読み取らせ、
          下記対応表の <b>CH番号</b> を選択させて送信させよ。
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

    // §4 ボタンモジュール
    const sec4 = document.createElement("div");
    sec4.className = "manual-book";
    sec4.innerHTML = `
      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§4</span>
          <span class="manual-sec-name">ボタンモジュール</span>
        </div>
        <p class="manual-lead">
          ボタンの <u>色</u> と <u>表記</u> を解除班員に確認させよ。
          下記手順を <b>上から照合</b> し、最初に合致した動作を指示すること。
        </p>
        <div class="manual-serial">
          シリアル末尾は
          <span class="manual-serial-val">${serialOdd ? "奇数" : "偶数"}</span>
          である。
        </div>
        <div class="manual-table-block">
          <table class="manual-table">
            <tr><th>No.</th><th>条件（上から照合）</th><th>動作</th></tr>
            <tr><td>①</td><td>表記が <b>ABORT</b></td><td><b>TAP</b>（短く押す）</td></tr>
            <tr><td>②</td><td>色が <b>赤</b></td><td><b>TAP</b></td></tr>
            <tr><td>③</td><td>シリアル末尾が <b>奇数</b></td><td><b>HOLD</b>（1.2秒以上長押し）</td></tr>
            <tr><td>④</td><td>上記いずれにも該当しない</td><td><b>TAP</b></td></tr>
          </table>
        </div>
        <div class="manual-warn-box">
          <b>警告</b> ── HOLD指示時は1.2秒以上の押下後に放させること。短すぎる/長すぎるは結果に影響しない。
        </div>
      </div>
    `;
    container.appendChild(sec4);
  }

  return { render };
})();
