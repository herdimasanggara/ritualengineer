(function () {
  var CYCLE = 10000;
  var SHOW_AT = 5000;
  var BOTTOM = "24px";

  var PAGES = [
    { slug: "",                 name: "Herdimas Anggara"  },
    { slug: "herdimasangarra",  name: "Herdimas Angarra"  },
    { slug: "herdimasanggarra", name: "Herdimas Anggarra" },
    { slug: "herdinasanggara",  name: "Herdinas Anggara"  },
    { slug: "hermidasanggara",  name: "Hermidas Anggara"  },
    { slug: "herrdimasanggara", name: "Herrdimas Anggara" }
  ];

  var local = location.protocol === "file:";
  var last = location.pathname.split("/").pop().replace(/\.html?$/i, "").toLowerCase();
  if (last === "index") last = "";
  var here = 0;
  for (var i = 0; i < PAGES.length; i++) if (PAGES[i].slug === last) here = i;
  var there = (here + 1) % PAGES.length;

  function urlFor(p) { return local ? (p.slug || "index") + ".html" : "/" + p.slug; }
  var NEXT = urlFor(PAGES[there]);
  var stay = /[?&]stay\b/.test(location.search);
  var t0 = Date.now();

  function go() { location.replace(NEXT); }
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

    { h: 120, w: 880, draw: function (st, W, H) {
      var q = ("Do you mean " + TO + "?").replace(/ /g, "");
      var off = "Doyoumean".length, nameNoSpace = TO.replace(/ /g, ""), diffNoSpace = [];
      for (var k = 0, j = 0; k < TO.length; k++) if (TO[k] !== " ") diffNoSpace[j++] = DIFF[k];
      var pending = [];
      var tiles = q.split("").map(function (ch, k) {
        var b = el("button", { type: "button" });
        var ni = k - off;
        if (ni >= 0 && ni < nameNoSpace.length && diffNoSpace[ni]) {
          var inner = el("i", {}, ["�"]);
          b.appendChild(el("b", {}, [inner]));
          pending.push({ e: inner, ch: ch });
        } else b.appendChild(document.createTextNode(ch));
        return b;
      });
      function wave(dy) {
        return function (t) { return { x: 20 + t * (W - 40), y: 40 + dy + Math.sin(t * Math.PI * 3) * 18 }; };
      }
      along(st, tiles, wave(0), 2, false);
      var sw = many(Math.ceil(tiles.length / 2.4), function () { return el("input", { type: "color", value: "#0000ff" }); });
      along(st, sw, wave(54), 2, false);
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
      whiskers.forEach(function (p, k) {
        p.style.position = "absolute"; st.appendChild(p);
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
      var y = 0;
      sels.forEach(function (s) {
        s.style.position = "absolute"; st.appendChild(s);
        s.style.left = Math.round((W - s.offsetWidth) / 2) + "px";
        s.style.top = y + "px";
        y += s.offsetHeight + 2;
      });
      var ribs = [];
      sels.forEach(function (s, k) {
        [-1, 1].forEach(function (side) {
          var p = el("progress", { max: "1", value: "0" });
          p.style.position = "absolute"; st.appendChild(p);
          var cx = W / 2 + side * (s.offsetWidth / 2 + p.offsetWidth / 2 + 8);
          p.style.left = Math.round(cx - p.offsetWidth / 2) + "px";
          p.style.top = Math.round(s.offsetTop + (s.offsetHeight - p.offsetHeight) / 2) + "px";
          p.style.transform = "rotate(" + (side * (k - 2) * 8) + "deg)" + (side < 0 ? " scaleX(-1)" : "");
          ribs.push(p);
        });
      });
      return function (f) { ribs.forEach(function (p) { p.value = f; }); };
    } }
  ];

  function show() {
    var css = el("style");
    css.textContent =
      "#doyoumean{position:fixed;left:0;right:0;bottom:" + BOTTOM + ";z-index:2147483647;pointer-events:none;" +
      "font-family:'Times New Roman',Times,serif;font-size:medium}" +
      "#doyoumean>div{position:relative;margin:0 auto;pointer-events:auto;cursor:pointer}" +
      "#doyoumean *{font-family:inherit;font-size:inherit;white-space:nowrap}";
    document.head.appendChild(css);

    var layer = el("div", { id: "doyoumean" });
    var ask = ASK[here];
    var W = Math.min(ask.w || 640, innerWidth - 32), H = ask.h;
    var stage = el("div");
    stage.style.width = W + "px";
    stage.style.height = H + "px";
    layer.appendChild(stage);
    document.body.appendChild(layer);
    stage.addEventListener("click", function (e) { e.preventDefault(); go(); });

    var tick = ask.draw(stage, W, H);
    if (tick) (function loop() { tick(progress()); requestAnimationFrame(loop); })();
  }

  setTimeout(show, SHOW_AT);
  if (!stay) setTimeout(go, CYCLE);
})();