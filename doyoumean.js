(function () {
  var CYCLE = 10000;
  var SHOW_AT = 5000;
  var BOTTOM = 24;

  var PAGES = [
    { url: "https://webresidencies.akademie-solitude.de/racun", file: "index", name: "Herdimas Anggara"  },
    { url: "https://ritual.engineer/herdimasangarra",            file: "rucan", name: "Herdimas Angarra"  },
    { url: "https://ritual.engineer/herdimasanggarra",           file: "carun", name: "Herdimas Anggarra" },
    { url: "https://ritual.engineer/herdinasanggara",            file: "curan", name: "Herdinas Anggara"  },
    { url: "https://ritual.engineer/hermidasanggara",            file: "nacur", name: "Hermidas Anggara"  },
    { url: "https://ritual.engineer/herrdimasanggara",           file: "canur", name: "Herrdimas Anggara" }
  ];

  var local = location.protocol === "file:";
  var segs = location.pathname.toLowerCase().split("/").filter(Boolean).map(function (x) { return x.replace(/\.html?$/, ""); });
  if (segs.length > 1 && segs[segs.length - 1] === "index") segs.pop();
  var last = segs.pop() || "";
  var here = 0;
  for (var i = 0; i < PAGES.length; i++) {
    var slug = PAGES[i].url.split("/").pop();
    if (PAGES[i].file === last || (slug === last && location.hostname === PAGES[i].url.split("/")[2])) here = i;
  }
  var there = (here + 1) % PAGES.length;

  function urlFor(p) { return local ? p.file + ".html" : p.url; }
  var NEXT = urlFor(PAGES[there]);
  var stay = /[?&]stay\b/.test(location.search);
  var t0 = Date.now();

  function go() {
    var w = window;
    try { if (window.top && window.top.location.href) w = window.top; } catch (e) { w = window; }
    try { w.location.replace(NEXT); } catch (e) { location.replace(NEXT); }
  }
  function progress() { return Math.max(0, Math.min(1, (Date.now() - t0 - SHOW_AT) / (CYCLE - SHOW_AT))); }
  function step(f, n) { return Math.min(n - 1, Math.floor(f * n)); }

  var pf = document.createElement("link");
  pf.rel = "prefetch"; pf.href = NEXT;
  document.head.appendChild(pf);

  function changed(a, b) {
    var m = a.length, n = b.length, L = [], x, y, out = [];
    for (x = 0; x <= m; x++) { L[x] = []; for (y = 0; y <= n; y++) L[x][y] = 0; }
    for (x = m - 1; x >= 0; x--) for (y = n - 1; y >= 0; y--)
      L[x][y] = a[x] === b[y] ? L[x + 1][y + 1] + 1 : Math.max(L[x + 1][y], L[x][y + 1]);
    for (y = 0; y < n; y++) out[y] = true;
    x = 0; y = 0;
    while (x < m && y < n) {
      if (a[x] === b[y]) { out[y] = false; x++; y++; }
      else if (L[x + 1][y] >= L[x][y + 1]) x++;
      else y++;
    }
    return out;
  }
  var FROM = PAGES[here].name, TO = PAGES[there].name, DIFF = changed(FROM, TO);
  var FIRST = TO.split(" ")[0], LAST = TO.slice(FIRST.length + 1);
  var WORDS = ["Do", "you", "mean", FIRST, LAST + "?"];

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  function marked(parent, s, e) {
    var run = "", isNew = null;
    function flush() {
      if (run) parent.appendChild(isNew ? el("b", {}, [el("i", {}, [run])]) : document.createTextNode(run));
      run = "";
    }
    for (var k = s; k < e; k++) {
      if (DIFF[k] !== isNew) { flush(); isNew = DIFF[k]; }
      run += TO[k];
    }
    flush();
    return parent;
  }
  function word(parent, w) {
    if (w < 3) parent.appendChild(document.createTextNode(WORDS[w]));
    else if (w === 3) marked(parent, 0, FIRST.length);
    else { marked(parent, FIRST.length + 1, TO.length); parent.appendChild(document.createTextNode("?")); }
    return parent;
  }

  function along(stage, items, curve, gap, turn) {
    var N = 300, pts = [], len = [0], k;
    for (k = 0; k <= N; k++) pts.push(curve(k / N));
    for (k = 1; k <= N; k++) len[k] = len[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    var total = len[N];
    items.forEach(function (it) { it.style.position = "absolute"; stage.appendChild(it); });
    var ws = items.map(function (it) { return it.offsetWidth; });
    var sum = ws.reduce(function (a, b) { return a + b; }, 0);
    if (sum + gap * (items.length - 1) > total) gap = (total - sum) / Math.max(1, items.length - 1);
    var used = sum + gap * (items.length - 1);
    var s = (total - used) / 2;
    items.forEach(function (it, j) {
      var mid = s + ws[j] / 2, q = 0;
      while (q < N && len[q + 1] < mid) q++;
      var a = pts[Math.max(0, q - 1)], b = pts[Math.min(N, q + 1)], p = pts[q];
      var deg = turn === false ? 0 : Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      it.style.left = Math.round(p.x - ws[j] / 2) + "px";
      it.style.top = Math.round(p.y - it.offsetHeight / 2) + "px";
      it.style.transform = "rotate(" + deg.toFixed(1) + "deg)";
      s += ws[j] + gap;
    });
  }
  function arc(cx, cy, rx, ry, a0, a1) {
    return function (t) {
      var a = (a0 + (a1 - a0) * t) * Math.PI / 180;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    };
  }
  function many(n, make) { var a = []; for (var k = 0; k < n; k++) a.push(make(k)); return a; }

  var ASK = [

    { h: 80, draw: function (st, W, H) {
      var line = el("button", { type: "button" }, ["Do you mean "]);
      marked(line, 0, TO.length);
      line.appendChild(document.createTextNode("?"));
      line.style.position = "absolute";
      st.appendChild(line);
      line.style.left = Math.round((W - line.offsetWidth) / 2) + "px";
      line.style.top = (H - line.offsetHeight) + "px";
      var radios = many(17, function () { return el("input", { type: "radio", name: "doyoumean" }); });
      along(st, radios, arc(W / 2, H - 12, line.offsetWidth / 2 + 20, H - 12, 180, 360), 4);
      return function (f) {
        radios[step(f, radios.length)].checked = true;
      };
    } },

    { h: 130, draw: function (st, W, H) {
      var tas = WORDS.map(function (w, k) {
        var ta = el("textarea", { rows: "1", cols: String(w.length + 1), readonly: "", spellcheck: "false" });
        ta.value = w;
        return ta;
      });
      along(st, tas, arc(W / 2, -110, 250, 160, 158, 22), 2);
      var boxes = many(19, function () { return el("input", { type: "checkbox" }); });
      along(st, boxes, arc(W / 2, -110, 215, 225, 150, 30), 4);
      return function (f) {
        var n = step(f, boxes.length + 1);
        boxes.forEach(function (b, k) { b.checked = k < n; });
      };
    } },

    { h: 110, draw: function (st, W, H) {
      var btns = WORDS.map(function (w, k) { return word(el("button", { type: "button" }), k); });
      along(st, btns, arc(W / 2, H + 40, 250, 130, 200, 340), 4);
      var dots = many(23, function () { return el("input", { type: "radio" }); });
      along(st, dots, arc(W / 2, H + 40, 210, 80, 200, 340), 4, false);
      return function (f) {
        var w = step(f, btns.length), d = step(f, dots.length + 1);
        btns.forEach(function (b, k) { b.style.visibility = k <= w ? "visible" : "hidden"; });
        dots.forEach(function (r, k) { r.checked = k < d; });
      };
    } },

    { h: 120, w: 880, narrow: { h: 170, w: 240 }, draw: function (st, W, H) {
      var pending = [];
      function tile(ch, isNew) {
        var b = el("button", { type: "button" });
        if (isNew) {
          var inner = el("i", {}, ["\uFFFD"]);
          b.appendChild(el("b", {}, [inner]));
          pending.push({ e: inner, ch: ch });
        } else b.appendChild(document.createTextNode(ch));
        return b;
      }
      function wave(dy, amp, periods, phase) {
        return function (t) { return { x: 12 + t * (W - 24), y: dy + Math.sin(t * Math.PI * 2 * periods + phase) * amp }; };
      }
      var names = TO.split(" ");
      if (W > 400) {
        var q = ("Do you mean " + TO + "?").replace(/ /g, ""), off = "Doyoumean".length, diffNoSpace = [];
        for (var k = 0, j = 0; k < TO.length; k++) if (TO[k] !== " ") diffNoSpace[j++] = DIFF[k];
        var tiles = q.split("").map(function (ch, k) {
          var ni = k - off;
          return tile(ch, ni >= 0 && ni < diffNoSpace.length && diffNoSpace[ni]);
        });
        along(st, tiles, wave(40, 18, 1.5, 0), 2, false);
        var VALS = [100, 70, 40, 85, 55, 30];
        var sw = many(6, function (k) { return el("input", { type: "range", value: String(VALS[k]) }); });
        along(st, sw, wave(94, 18, 1.5, 0), 2, false);
      } else {
        var y = 16;
        WORDS.forEach(function (w, r) {
          var row;
          if (r < 3) row = w.split("").map(function (ch) { return tile(ch, false); });
          else {
            var start = r === 3 ? 0 : FIRST.length + 1, nm = names[r - 3];
            row = nm.split("").map(function (ch, k) { return tile(ch, DIFF[start + k]); });
            if (r === 4) row.push(tile("?", false));
          }
          along(st, row, wave(y, 6, 1, r % 2 ? Math.PI : 0), 2, false);
          y += 34;
        });
      }
      return function (f) {
        var n = step(f, pending.length + 1);
        pending.forEach(function (p, k) { p.e.textContent = k < n ? p.ch : "\uFFFD"; });
      };
    } },

    { h: 120, draw: function (st, W, H) {
      var top = el("textarea", { rows: "1", cols: "12", readonly: "", spellcheck: "false" });
      var mid = el("textarea", { rows: "1", cols: String(Math.max(FROM.length, TO.length) + 1), readonly: "", spellcheck: "false" });
      var end = el("textarea", { rows: "1", cols: "2", readonly: "", spellcheck: "false" });
      [top, mid, end].forEach(function (ta) { ta.style.position = "absolute"; st.appendChild(ta); });
      var y = 0;
      [top, mid, end].forEach(function (ta) {
        ta.style.left = Math.round((W - ta.offsetWidth) / 2) + "px";
        ta.style.top = y + "px";
        y += ta.offsetHeight + 4;
      });
      var whiskers = many(6, function () { return el("progress", { max: "1", value: "0" }); });
      var room = Math.floor((view().w - 16 - mid.offsetWidth - 32) / 2);
      whiskers.forEach(function (p, k) {
        p.style.position = "absolute"; st.appendChild(p);
        if (room < p.offsetWidth) p.style.width = Math.max(40, room) + "px";
        var side = k < 3 ? -1 : 1, row = k % 3;
        var cx = W / 2 + side * (mid.offsetWidth / 2 + p.offsetWidth / 2 + 16);
        p.style.left = Math.round(cx - p.offsetWidth / 2) + "px";
        p.style.top = Math.round(14 + row * 34) + "px";
        p.style.transform = "rotate(" + (side * (row - 1) * -14) + "deg)" + (side < 0 ? " scaleX(-1)" : "");
      });
      var p = 0; while (p < FROM.length && FROM[p] === TO[p]) p++;
      var steps = [], s = "", k;
      for (k = 1; k <= 11; k++) steps.push(["Do you mean".slice(0, k), "", ""]);
      for (k = 1; k <= FROM.length; k++) steps.push(["Do you mean", FROM.slice(0, k), ""]);
      for (k = 0; k < 6; k++) steps.push(["Do you mean", FROM, ""]);
      for (k = FROM.length - 1; k >= p; k--) steps.push(["Do you mean", FROM.slice(0, k), ""]);
      for (k = p + 1; k <= TO.length; k++) steps.push(["Do you mean", TO.slice(0, k), ""]);
      steps.push(["Do you mean", TO, "?"]);
      return function (f) {
        var st8 = steps[step(f, steps.length)];
        top.value = st8[0]; mid.value = st8[1]; end.value = st8[2];
        whiskers.forEach(function (w) { w.value = f; });
      };
    } },

    { h: 150, draw: function (st, W, H) {
      var sels = WORDS.map(function (w) { var s = el("select"); s.appendChild(el("option", {}, [w])); return s; });
      var y = 0, widest = 0;
      sels.forEach(function (s) {
        s.style.position = "absolute"; st.appendChild(s);
        s.style.left = Math.round((W - s.offsetWidth) / 2) + "px";
        s.style.top = y + "px";
        y += s.offsetHeight + 2;
        widest = Math.max(widest, s.offsetWidth);
      });
      var GAP = 6, probe = el("input", { type: "range" });
      st.appendChild(probe);
      var rw = Math.min(probe.offsetWidth, Math.floor((view().w - 16 - widest - 2 * GAP) / 2));
      st.removeChild(probe);
      var ribs = [];
      sels.forEach(function (s, k) {
        [-1, 1].forEach(function (side) {
          var r = el("input", { type: "range", min: "0", max: "1000", value: "0" });
          r.style.position = "absolute"; r.style.width = rw + "px"; st.appendChild(r);
          var x = side < 0 ? s.offsetLeft - GAP - r.offsetWidth : s.offsetLeft + s.offsetWidth + GAP;
          r.style.left = x + "px";
          r.style.top = Math.round(s.offsetTop + (s.offsetHeight - r.offsetHeight) / 2) + "px";
          if (side < 0) r.style.transform = "scaleX(-1)";
          ribs.push(r);
        });
      });
      return function (f) { var v = String(Math.round(f * 1000)); ribs.forEach(function (r) { r.value = v; }); };
    } }
  ];

  function view() {
    var v = window.visualViewport;
    if (v) return { x: v.offsetLeft, y: v.offsetTop, w: v.width, h: v.height };
    return { x: 0, y: 0, w: document.documentElement.clientWidth, h: innerHeight };
  }

  function show() {
    var css = el("style");
    css.textContent =
      "#doyoumean{position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;" +
      "font-family:'Times New Roman',Times,serif;font-size:medium;-webkit-text-size-adjust:100%;text-size-adjust:100%}" +
      "#doyoumean>div{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer}#doyoumean>div>div{transform-origin:0 0}" +
      "#doyoumean *{font-family:inherit;font-size:inherit;white-space:nowrap}";
    document.head.appendChild(css);

    var layer = el("div", { id: "doyoumean" });
    var ask = ASK[here];
    var W = ask.w || 640, H = ask.h;
    if (ask.narrow && view().w - 16 < W) { W = ask.narrow.w; H = ask.narrow.h; }
    var wrap = el("div");
    var stage = el("div");
    stage.style.position = "absolute"; stage.style.left = "0"; stage.style.top = "0";
    stage.style.width = W + "px";
    stage.style.height = H + "px";
    wrap.appendChild(stage);
    layer.appendChild(wrap);
    var ZOOM = "zoom" in stage.style;
    document.body.appendChild(layer);
    stage.addEventListener("click", function (e) { e.preventDefault(); go(); });

    var tick = ask.draw(stage, W, H);

    var sr = stage.getBoundingClientRect(), bx = Infinity, by = Infinity, bx2 = -Infinity, by2 = -Infinity;
    stage.querySelectorAll("*").forEach(function (e) {
      if (e.parentNode !== stage) return;
      var r = e.getBoundingClientRect();
      bx = Math.min(bx, r.left - sr.left); by = Math.min(by, r.top - sr.top);
      bx2 = Math.max(bx2, r.right - sr.left); by2 = Math.max(by2, r.bottom - sr.top);
    });
    var bw = bx2 - bx, bh = by2 - by;

    var last = "";
    function place() {
      var v = view();
      var s = Math.min(1, (v.w - 16) / bw, (v.h * 0.6) / bh);
      var x = v.x + (v.w - bw * s) / 2 - bx * s;
      var y = v.y + v.h - BOTTOM - by2 * s;
      var t = Math.round(x) + "," + Math.round(y) + "," + s.toFixed(3);
      if (t === last) return;
      last = t;
      wrap.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      if (ZOOM) stage.style.zoom = s.toFixed(3);
      else stage.style.transform = "scale(" + s.toFixed(3) + ")";
    }
    (function loop() {
      place();
      if (tick) tick(progress());
      requestAnimationFrame(loop);
    })();
  }

  setTimeout(show, SHOW_AT);
  if (!stay) setTimeout(go, CYCLE);
})();