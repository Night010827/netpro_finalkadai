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
          ディスプレイの <b>4桁</b> を読み上げさせ、次の<b>手順を順に</b>適用して
          解除コードを算出せよ。手順を飛ばしてはならない。
        </p>
        <div class="manual-table-block">
          <table class="manual-table">
            <tr><th>手順</th><th>操作</th></tr>
            <tr><td>Ⅰ</td><td>表示4桁を合計し、その <b>一の位</b> を <b>K</b> とする<sup>†</sup></td></tr>
            <tr><td>Ⅱ</td><td>各桁に <b>K を加算</b> し、<b>10 で割った余り</b> に置き換える</td></tr>
            <tr><td>Ⅲ</td><td>Ⅱの4桁を、<span class="manual-dim">下欄の指示</span>に従って並べる</td></tr>
          </table>
          <div class="manual-margin-note">
            <sup>†</sup> 例: 表示 3 8 2 5 → 3+8+2+5=18 → 一の位は 8、すなわち K=8。
            各桁+8 mod10 = 1 6 0 3。
          </div>
        </div>
        <p class="manual-lead manual-dim">
          Ⅲの並べ方 ── 機体シリアルの末尾が
          <u>${serialOdd ? "奇数のときは逆順" : "偶数のときは表示と同じ向き"}</u>、
          <span class="manual-dim">それ以外は他方</span>とする。
          （上例では ${serialOdd ? "3 0 6 1" : "1 6 0 3"} を入力）
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

    // §4 サイモンモジュール
    const sec4 = document.createElement("div");
    sec4.className = "manual-book";
    sec4.innerHTML = `
      <div class="manual-section">
        <div class="manual-sec-head">
          <span class="manual-sec-no">§4</span>
          <span class="manual-sec-name">記憶モジュール（サイモン）</span>
        </div>
        <p class="manual-lead">
          「再生」を押すと4つのランプが <b>一定の順</b> で点滅する。
          解除班員に <u>点滅した色を順に</u> 読み上げさせ、各色を下表で
          <b>読み替えた色</b> を、<b>同じ順番</b> でボタンに入力させよ。
          <span class="manual-dim">点滅色そのものを押させてはならない。</span>
        </p>
        <div class="manual-table-block">
          <div class="manual-table-cap">
            変換表 ── 機体シリアル末尾が
            <b>${serialOdd ? "奇数" : "偶数"}</b> の機体に適用<sup>‡</sup>
          </div>
          <table class="manual-table">
            <tr><th>点滅した色</th><th>押す色</th></tr>
            ${serialOdd
              ? `<tr><td>赤</td><td><b>青</b></td></tr>
                 <tr><td>緑</td><td><b>黄</b></td></tr>
                 <tr><td>青</td><td><b>赤</b></td></tr>
                 <tr><td>黄</td><td><b>緑</b></td></tr>`
              : `<tr><td>赤</td><td><b>緑</b></td></tr>
                 <tr><td>緑</td><td><b>赤</b></td></tr>
                 <tr><td>青</td><td><b>黄</b></td></tr>
                 <tr><td>黄</td><td><b>青</b></td></tr>`}
          </table>
          <div class="manual-margin-note">
            <sup>‡</sup> 末尾が反対の奇偶であった場合、赤と緑・青と黄の対応はすべて入れ替わる。
          </div>
        </div>
        <div class="manual-warn-box">
          <b>警告</b> ── 全 <b>4色ぶん</b> を入力し終えてから「送信」を押させること。
          途中で誤ったら「↺」で入力を消し、再生からやり直すこと。
        </div>
      </div>
    `;
    container.appendChild(sec4);
  }

  return { render };
})();
