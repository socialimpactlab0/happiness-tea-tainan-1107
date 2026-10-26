/* =========================================================
   幸福茶席・報名成功電子邀請卡  assets/invite-card.js
   - 不修改 app.js / GAS：偵測「報名完成」區塊出現後才產生卡片
   - 卡片用 canvas 畫成圖片，網頁看到的 = 下載的
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. 之後要改的設定都在這裡 ---------- */
  var SETTINGS = {
    // 背景圖：準備好後填路徑，例如 "assets/images/invite-bg.jpg"；留空 = 用簡單配色
    backgroundImage: "",
    title: "幸福茶席",
    subtitle: "11/7 台南・免費公益講座",
    inviteBefore: "誠摯邀請",
    inviteAfter: "入席",
    inviteLine: "11 月 7 日午後，為您保留一席茶",
    date: "2026 年 11 月 7 日（六）",
    time: "下午 2:00 入席・2:30 開始",
    venue: "台南維悅酒店 B1 國際會議廳",
    address: "台南市安平區慶平路 539 號",
    welcome: "一杯茶的時間，好好照顧自己。期待與您茶席相見。",
    contact: "報名窗口｜謝小姐 0910-283-352",
    shareText: "我報名了 11/7 台南「幸福茶席」免費公益講座，一起來喝杯茶吧！",
    fileName: "幸福茶席邀請卡"
  };

  var C = { paper: "#FBF8F1", paper2: "#F1E9D8", green: "#2B4234", gold: "#B08D52",
            goldL: "#D9C49B", tea: "#8A6A47", ink: "#241F1A", ink2: "#5A5148" };
  var SERIF = '"Noto Serif TC","Noto Serif CJK TC","Songti TC","PMingLiU",serif';
  var W = 1080, H = 1350;

  /* ---------- 2. 樣式（自動加進網頁，不用另外改 CSS） ---------- */
  var css = ""
    + ".invite-card-box{margin:22px 0 18px}"
    + ".invite-card-box img{display:block;width:100%;height:auto;border-radius:6px;box-shadow:0 12px 30px rgba(60,50,38,.18);-webkit-touch-callout:default}"
    + ".invite-card-actions{display:grid;gap:12px;margin-top:18px}"
    + ".invite-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:58px;border:none;border-radius:6px;font:inherit;font-size:19px;font-weight:700;letter-spacing:.06em;color:#fff;cursor:pointer}"
    + ".invite-btn-save{background:" + C.green + "}"
    + ".invite-btn-line{background:#06C755}"
    + ".invite-btn:active{transform:scale(.98)}"
    + ".invite-card-tip{margin-top:12px!important;font-size:16px!important;color:" + C.ink2 + "!important}";
  var styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------- 3. 畫卡片 ---------- */
  function font(size, weight) { return (weight || 500) + " " + size + "px " + SERIF; }

  function setSpacing(ctx, px) { if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px"; }

  // 文字太長時自動縮小字級
  function fitText(ctx, text, y, size, weight, maxWidth, color) {
    var s = size;
    ctx.font = font(s, weight);
    while (ctx.measureText(text).width > maxWidth && s > 30) { s -= 2; ctx.font = font(s, weight); }
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function drawTeaCup(ctx, cx, top) {
    ctx.save();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.lineCap = "round";
    // 熱氣
    [-34, 0, 34].forEach(function (dx, i) {
      var x = cx + dx, y0 = top + (i === 1 ? 0 : 14);
      ctx.beginPath(); ctx.moveTo(x, y0 + 70);
      ctx.bezierCurveTo(x - 16, y0 + 50, x + 16, y0 + 30, x, y0);
      ctx.stroke();
    });
    var rimY = top + 100;
    // 杯口
    ctx.beginPath(); ctx.ellipse(cx, rimY, 92, 15, 0, 0, Math.PI * 2); ctx.stroke();
    // 杯身
    ctx.beginPath(); ctx.moveTo(cx - 92, rimY);
    ctx.bezierCurveTo(cx - 88, rimY + 62, cx - 44, rimY + 88, cx, rimY + 88);
    ctx.bezierCurveTo(cx + 44, rimY + 88, cx + 88, rimY + 62, cx + 92, rimY);
    ctx.stroke();
    // 杯托
    ctx.beginPath(); ctx.ellipse(cx, rimY + 98, 140, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawOrnament(ctx, y) {
    ctx.save();
    ctx.strokeStyle = C.goldL; ctx.fillStyle = C.gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 200, y); ctx.lineTo(W / 2 - 22, y);
    ctx.moveTo(W / 2 + 22, y); ctx.lineTo(W / 2 + 200, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, y - 9); ctx.lineTo(W / 2 + 9, y);
    ctx.lineTo(W / 2, y + 9); ctx.lineTo(W / 2 - 9, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  async function drawCard(names) {
    // 先確保網站字型載入，避免卡片字型跑掉
    var allText = Object.keys(SETTINGS).map(function (k) { return SETTINGS[k]; }).join("") + names;
    try {
      await Promise.all([
        document.fonts.load(font(60, 600), allText),
        document.fonts.load(font(60, 500), allText)
      ]);
    } catch (e) {}

    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.textAlign = "center";

    // 背景
    var bg = ctx.createRadialGradient(W / 2, 260, 80, W / 2, H / 2, 900);
    bg.addColorStop(0, C.paper); bg.addColorStop(1, C.paper2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var photo = await loadImage(SETTINGS.backgroundImage);
    if (photo) {
      var scale = Math.max(W / photo.width, H / photo.height);
      var pw = photo.width * scale, ph = photo.height * scale;
      ctx.drawImage(photo, (W - pw) / 2, (H - ph) / 2, pw, ph);
      ctx.fillStyle = "rgba(251,248,241,.78)"; // 淡化背景，讓字清楚
      ctx.fillRect(0, 0, W, H);
    }

    // 金色雙框
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = C.goldL; ctx.lineWidth = 1.5; ctx.strokeRect(50, 50, W - 100, H - 100);

    // 上方：茶杯 + 標題
    drawTeaCup(ctx, W / 2, 78);
    setSpacing(ctx, 24);
    fitText(ctx, SETTINGS.title, 422, 118, 600, 900, C.green);
    setSpacing(ctx, 4);
    fitText(ctx, SETTINGS.subtitle, 476, 32, 500, 800, C.tea);
    setSpacing(ctx, 0);
    drawOrnament(ctx, 526);

    // 中間：邀請語 + 姓名
    setSpacing(ctx, 10);
    fitText(ctx, SETTINGS.inviteBefore, 600, 44, 500, 800, C.ink2);
    setSpacing(ctx, 6);
    fitText(ctx, names, 712, 100, 600, 880, C.ink);
    setSpacing(ctx, 10);
    fitText(ctx, SETTINGS.inviteAfter, 792, 44, 500, 800, C.ink2);
    setSpacing(ctx, 2);
    fitText(ctx, SETTINGS.inviteLine, 852, 32, 500, 860, C.tea);

    // 下方：日期地點（深綠框）
    ctx.fillStyle = C.green; roundRect(ctx, 110, 892, W - 220, 236, 14); ctx.fill();
    setSpacing(ctx, 2);
    fitText(ctx, SETTINGS.date, 958, 42, 600, 800, "#FFFFFF");
    fitText(ctx, SETTINGS.time, 1010, 34, 500, 800, C.goldL);
    fitText(ctx, SETTINGS.venue, 1066, 36, 600, 800, "#FFFFFF");
    fitText(ctx, SETTINGS.address, 1108, 28, 500, 800, "#E2D9C6");

    // 歡迎語 + 報名窗口
    setSpacing(ctx, 1);
    fitText(ctx, SETTINGS.welcome, 1192, 32, 500, 880, C.tea);
    fitText(ctx, SETTINGS.contact, 1250, 28, 500, 800, C.ink2);
    setSpacing(ctx, 0);

    return canvas;
  }

  /* ---------- 4. 讀取報名姓名 ---------- */
  function getNames() {
    var form = document.getElementById("registrationForm");
    if (!form) return "";
    var size = Number(form.elements.partySize && form.elements.partySize.value) || 1;
    var list = [];
    for (var i = 1; i <= size; i++) {
      var input = form.elements["participant" + i + "Name"];
      var v = input ? String(input.value || "").trim() : "";
      if (v) list.push(v);
    }
    return list.join("、") || "貴賓";
  }

  /* ---------- 5. 按鈕：下載、分享到 LINE ---------- */
  var currentBlob = null, currentNames = "";

  function makeFile() {
    return new File([currentBlob], SETTINGS.fileName + "-" + currentNames.replace(/[、\s]/g, "") + ".png", { type: "image/png" });
  }

  function canShareFile() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [makeFile()] })); }
    catch (e) { return false; }
  }

  async function saveImage() {
    if (!currentBlob) return;
    var isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isPhone && canShareFile()) {
      try { await navigator.share({ files: [makeFile()] }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    var url = URL.createObjectURL(currentBlob);
    var a = document.createElement("a");
    a.href = url; a.download = makeFile().name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  async function shareToLine() {
    var pageUrl = location.origin + location.pathname;
    if (currentBlob && canShareFile()) {
      try { await navigator.share({ files: [makeFile()], text: SETTINGS.shareText + "\n" + pageUrl }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    // 不能傳圖片時：改用 LINE 分享文字 + 報名網址
    location.href = "https://line.me/R/share?text=" + encodeURIComponent(SETTINGS.shareText + "\n" + pageUrl);
  }

  /* ---------- 6. 報名完成時自動產生 ---------- */
  async function showCard() {
    var box = document.getElementById("inviteCardBox");
    var img = document.getElementById("inviteCardImg");
    if (!box || !img) return;
    currentNames = getNames();
    var canvas = await drawCard(currentNames);
    img.src = canvas.toDataURL("image/png");
    img.alt = "幸福茶席電子邀請卡：誠摯邀請 " + currentNames + " 入席";
    canvas.toBlob(function (b) { currentBlob = b; }, "image/png");
    box.hidden = false;
  }

  function init() {
    var success = document.getElementById("successState");
    var saveBtn = document.getElementById("inviteSaveBtn");
    var lineBtn = document.getElementById("inviteLineBtn");
    if (!success || !saveBtn || !lineBtn) return;
    saveBtn.addEventListener("click", saveImage);
    lineBtn.addEventListener("click", shareToLine);
    new MutationObserver(function () {
      if (!success.hidden) showCard();
    }).observe(success, { attributes: true, attributeFilter: ["hidden"] });
  }

  // 給樣本頁或手動測試使用：window.HappinessInviteCard.preview("王小明")
  window.HappinessInviteCard = { draw: drawCard, settings: SETTINGS };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
