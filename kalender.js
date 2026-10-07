// Kalender ekonomi (v1.1.167): rilis data AS dan keputusan bank sentral untuk XAUUSD. Digabung dari kalender-ekonomi v1.0.0.
// Jadwal ada di array EVENTS di bawah (waktu dalam UTC). Berdiri sendiri: hanya memakai id/kelas berawalan "kal".
(function () {
  if (!document.getElementById("kalList")) return;
  // Waktu disimpan dalam UTC. Rilis 08:30 ET = 12:30Z selama EDT, 13:30Z setelah 1 Nov (EST).
  var GOLD_CPI = "Inflasi di atas ekspektasi cenderung menaikkan yield dan USD sehingga menekan emas; di bawah ekspektasi biasanya mendukung emas. Spread melebar saat rilis.";
  var EVENTS = [
    { id: "nfp-2026-10", t: "2026-10-02T12:30:00Z", cur: "USD", name: "Nonfarm Payrolls (data September)", impact: 3, status: "ok", gold: "Data tenaga kerja kuat cenderung menguatkan USD dan menekan emas; data lemah memperbesar peluang pemangkasan suku bunga dan biasanya mendukung emas." },
    { id: "fomc-min-2026-10", t: "2026-10-07T18:00:00Z", cur: "USD", name: "Risalah Rapat FOMC (rapat September)", impact: 2, status: "ok", gold: "Risalah menunjukkan arah pembahasan suku bunga. Nada hawkish menekan emas, nada dovish mendukungnya." },
    { id: "jc-2026-10-08", t: "2026-10-08T12:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "ok", f: "200K", p: "197K", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "cpi-2026-10", t: "2026-10-14T12:30:00Z", cur: "USD", name: "CPI Inflasi Konsumen (data September)", impact: 3, status: "ok", f: "3,7% y/y (bulanan 0,6%); inti 2,4% y/y", p: "3,4% y/y; inti 2,4% y/y", gold: GOLD_CPI },
    { id: "ppi-2026-10", t: "2026-10-15T12:30:00Z", cur: "USD", name: "PPI Inflasi Produsen (data September)", impact: 2, status: "est", gold: "Dilihat sebagai petunjuk tekanan harga di hulu setelah CPI." },
    { id: "jc-2026-10-15", t: "2026-10-15T12:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "ok", gold: "Rilis rutin tiap Kamis." },
    { id: "ret-2026-10", t: "2026-10-16T12:30:00Z", cur: "USD", name: "Penjualan Ritel (data September)", impact: 2, status: "est", gold: "Ukuran belanja konsumen. Angka kuat mendukung USD, angka lemah mendukung emas." },
    { id: "jc-2026-10-22", t: "2026-10-22T12:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "ok", gold: "Rilis rutin tiap Kamis." },
    { id: "fomc-2026-10", t: "2026-10-28T18:00:00Z", cur: "USD", name: "Keputusan Suku Bunga FOMC (rapat 27-28 Okt)", impact: 3, status: "ok", gold: "Pernyataan keluar 14:00 ET dan konferensi pers Ketua Fed sekitar 30 menit kemudian. Volatilitas tertinggi biasanya terjadi di konferensi pers." },
    { id: "gdp-2026-10", t: "2026-10-29T12:30:00Z", cur: "USD", name: "PDB Kuartal III, estimasi awal", impact: 3, status: "ok", gold: "Pertumbuhan kuat mendukung USD; pelemahan ekonomi menaikkan permintaan aset aman." },
    { id: "jc-2026-10-29", t: "2026-10-29T12:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "ok", gold: "Rilis rutin tiap Kamis." },
    { id: "pce-2026-10", t: "2026-10-30T12:30:00Z", cur: "USD", name: "PCE Inti dan Belanja Pribadi (data September)", impact: 3, status: "est", gold: "Ukuran inflasi yang diacu Fed. Reaksinya mirip CPI." },
    { id: "ism-2026-11", t: "2026-11-02T15:00:00Z", cur: "USD", name: "ISM PMI Manufaktur", impact: 2, status: "est", gold: "Di bawah 50 berarti kontraksi sektor manufaktur." },
    { id: "jc-2026-11-05", t: "2026-11-05T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "ok", gold: "Rilis rutin tiap Kamis." },
    { id: "nfp-2026-11", t: "2026-11-06T13:30:00Z", cur: "USD", name: "Nonfarm Payrolls (data Oktober)", impact: 3, status: "est", gold: "Data tenaga kerja kuat cenderung menguatkan USD dan menekan emas; data lemah mendukung emas." }
  ];

  // Zona waktu awal mengikuti Setelan jurnal (jurnalTzOffset, menit) bila belum ada pilihan tersimpan.
  function defaultTz() {
    var o; try { o = +localStorage.getItem("jurnalTzOffset"); } catch (e) {}
    return { 180: "Etc/GMT-3", 420: "Asia/Jakarta", 480: "Asia/Makassar", 540: "Asia/Jayapura" }[o] || "Asia/Makassar";
  }
  var IMPACT_LABEL = { 3: "Tinggi", 2: "Sedang", 1: "Rendah" };
  var RANGES = [{ k: 7, l: "7 hari" }, { k: 30, l: "30 hari" }, { k: 0, l: "Semua" }];
  var state = { tz: defaultTz(), imp: { 1: true, 2: true, 3: true }, range: 30, past: false };
  var manual = [], notes = {}, open = {};

  function load(key, fallback) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  var prefs = load("kal-prefs", null);
  if (prefs) { for (var k in prefs) if (k in state) state[k] = prefs[k]; }
  if (!/^(Asia\/Makassar|Asia\/Jakarta|Asia\/Jayapura|Etc\/GMT-3|UTC|America\/New_York)$/.test(state.tz)) state.tz = defaultTz();
  manual = load("kal-manual", []);
  notes = load("kal-notes", {});

  function $(id) { return document.getElementById(id); }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function fmt(ts, tz, opts) { return new Intl.DateTimeFormat("id-ID", Object.assign({ timeZone: tz }, opts)).format(new Date(ts)); }
  function dayKey(ts, tz) { return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts)); }
  function hhmm(ts, tz) { return fmt(ts, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).replace(".", ":"); }
  function tzShort(tz) { return { "Asia/Makassar": "WITA", "Asia/Jakarta": "WIB", "Asia/Jayapura": "WIT", "Etc/GMT-3": "Broker", "UTC": "UTC", "America/New_York": "ET" }[tz] || tz; }

  function tzOffset(ts, tz) {
    var p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(ts)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts;
  }
  function zonedToUtc(date, time, tz) {
    var d = date.split("-").map(Number), t = time.split(":").map(Number);
    var guess = Date.UTC(d[0], d[1] - 1, d[2], t[0], t[1]);
    var ts = guess - tzOffset(guess, tz);
    ts = guess - tzOffset(ts, tz);
    return ts;
  }

  function allEvents() {
    var out = EVENTS.map(function (e) { return Object.assign({ ts: Date.parse(e.t) }, e); });
    manual.forEach(function (m) { out.push(Object.assign({ manual: true, status: "manual", gold: "Event buatan sendiri." }, m)); });
    return out.sort(function (a, b) { return a.ts - b.ts; });
  }

  function buildControls() {
    var tz = $("kalTz"); tz.value = state.tz;
    tz.addEventListener("change", function () { state.tz = tz.value; persist(); render(); tick(); window.dispatchEvent(new Event("kalChanged")); });

    var ic = $("kalImpChips"); ic.textContent = "";
    [3, 2, 1].forEach(function (n) {
      var b = h("button", "kal-chip"); b.type = "button";
      var d = h("span", "kal-dot"); d.style.background = n === 3 ? "var(--loss)" : n === 2 ? "var(--gold)" : "var(--paper-faint)";
      b.appendChild(d); b.appendChild(document.createTextNode(IMPACT_LABEL[n]));
      b.setAttribute("aria-pressed", String(!!state.imp[n]));
      b.addEventListener("click", function () { state.imp[n] = !state.imp[n]; b.setAttribute("aria-pressed", String(!!state.imp[n])); persist(); render(); });
      ic.appendChild(b);
    });

    var rc = $("kalRangeChips"); rc.textContent = "";
    RANGES.forEach(function (r) {
      var b = h("button", "kal-chip", r.l); b.type = "button"; b.dataset.k = r.k;
      b.setAttribute("aria-pressed", String(state.range === r.k));
      b.addEventListener("click", function () {
        state.range = r.k;
        rc.querySelectorAll(".kal-chip").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.k === state.range)); });
        persist(); render();
      });
      rc.appendChild(b);
    });

    var pc = $("kalPastChip"); pc.setAttribute("aria-pressed", String(state.past));
    pc.addEventListener("click", function () { state.past = !state.past; pc.setAttribute("aria-pressed", String(state.past)); persist(); render(); });

  }
  function persist() { save("kal-prefs", state); }

  // Isian angka: catatan pengguna (notes) menang atas nilai bawaan di EVENTS (f = prakiraan, p = sebelumnya); mengosongkan kolom berarti kosong.
  function byId(id) { return allEvents().filter(function (x) { return x.id === id; })[0] || {}; }
  function val(e, key) { var n = notes[e.id]; return n && n[key] !== undefined ? n[key] : (e[key] || ""); }
  function valsLine(id) {
    var parts = [], e = byId(id);
    if (val(e, "a")) parts.push("Aktual " + val(e, "a"));
    if (val(e, "f")) parts.push("Prakiraan " + val(e, "f"));
    if (val(e, "p")) parts.push("Sebelumnya " + val(e, "p"));
    return parts.join("  ·  ");
  }

  function render() {
    var now = Date.now(), tz = state.tz, list = $("kalList");
    list.textContent = "";
    // Peringatan jadwal hampir habis: event bawaan terakhir kurang dari 7 hari lagi (atau sudah lewat).
    var st = $("kalStale"), lastTs = Math.max.apply(null, EVENTS.map(function (x) { return Date.parse(x.t); }));
    if (st) {
      st.hidden = lastTs - now > 7 * 86400000;
      if (!st.hidden) st.textContent = (lastTs < now ? "Jadwal bawaan sudah berakhir pada " : "Jadwal bawaan segera berakhir pada ") + fmt(lastTs, tz, { day: "numeric", month: "long", year: "numeric" }) + ". Perbarui array EVENTS di kalender.js (lihat README) atau tambah event sendiri di bawah.";
    }
    var evs = allEvents().filter(function (e) {
      if (!state.imp[e.impact]) return false;
      var isPast = e.ts < now;
      if (isPast && !state.past) return false;
      if (state.range && !isPast && e.ts > now + state.range * 86400000) return false;
      return true;
    });
    if (!evs.length) {
      list.appendChild(h("div", "kal-empty", "Tidak ada event untuk filter ini. Perlebar rentang atau aktifkan level dampak lain."));
      return;
    }
    var today = dayKey(now, tz), groups = [], map = {};
    evs.forEach(function (e) {
      var k = dayKey(e.ts, tz);
      if (!map[k]) { map[k] = { k: k, ts: e.ts, items: [] }; groups.push(map[k]); }
      map[k].items.push(e);
    });
    groups.forEach(function (g) {
      var day = h("div", "kal-day");
      var h2 = h("h3", g.k === today ? "kal-today" : "", fmt(g.ts, tz, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
      if (g.k === today) h2.appendChild(h("span", "kal-tag", "HARI INI"));
      day.appendChild(h2);
      g.items.forEach(function (e) { day.appendChild(eventNode(e, now, tz)); });
      list.appendChild(day);
    });
  }

  function eventNode(e, now, tz) {
    var wrap = h("div", "kal-ev" + (e.ts < now ? " kal-past" : ""));
    var row = h("button", "kal-row"); row.type = "button";
    row.setAttribute("aria-expanded", String(!!open[e.id]));

    var time = h("div", "kal-time", hhmm(e.ts, tz)); time.appendChild(h("small", "", tzShort(tz)));
    var main = h("div", "kal-main");
    main.appendChild(h("div", "kal-title", e.name));
    var meta = h("div", "kal-meta");
    meta.appendChild(h("span", "kal-cur", e.cur));
    meta.appendChild(h("span", "", IMPACT_LABEL[e.impact]));
    meta.appendChild(h("span", "kal-badge" + (e.status === "est" ? " kal-est" : ""), e.status === "ok" ? "Terkonfirmasi" : e.status === "est" ? "Perkiraan" : "Manual"));
    main.appendChild(meta);
    var vl = valsLine(e.id); if (vl) main.appendChild(h("div", "kal-vals", vl));
    var imp = h("div", "kal-imp l" + e.impact); imp.setAttribute("aria-hidden", "true");
    imp.appendChild(h("i")); imp.appendChild(h("i")); imp.appendChild(h("i"));
    row.appendChild(time); row.appendChild(main); row.appendChild(imp);
    row.addEventListener("click", function () { open[e.id] = !open[e.id]; render(); });
    wrap.appendChild(row);

    if (open[e.id]) {
      var d = h("div", "kal-detail");
      var p = h("p"); p.appendChild(h("b", "", "Pengaruh ke emas: ")); p.appendChild(document.createTextNode(e.gold)); d.appendChild(p);
      var f = h("div", "kal-fields");
      [["f", "Prakiraan"], ["p", "Sebelumnya"], ["a", "Aktual"]].forEach(function (x) {
        var lab = h("label"); lab.appendChild(h("span", "kal-lbl", x[1]));
        var inp = h("input", "settings-input"); inp.type = "text"; inp.id = "kal-in-" + x[0] + "-" + e.id; inp.value = val(e, x[0]); inp.autocomplete = "off";
        inp.addEventListener("change", function () {
          notes[e.id] = notes[e.id] || {}; notes[e.id][x[0]] = inp.value.trim(); save("kal-notes", notes); render();
        });
        lab.appendChild(inp); f.appendChild(lab);
      });
      d.appendChild(f);
      if (e.manual) {
        var del = h("button", "kal-del", "Hapus event"); del.type = "button";
        del.addEventListener("click", function () { manual = manual.filter(function (m) { return m.id !== e.id; }); save("kal-manual", manual); render(); tick(); });
        d.appendChild(del);
      }
      wrap.appendChild(d);
    }
    return wrap;
  }

  function tick() {
    var now = Date.now(), tz = state.tz;
    $("kalClock").textContent = fmt(now, tz, { weekday: "short", day: "numeric", month: "short" }) + "  " +
      fmt(now, tz, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).replace(/\./g, ":") + " " + tzShort(tz);
    var nx = allEvents().filter(function (e) { return e.impact === 3 && e.ts > now; })[0];
    if (!nx) { $("kalNextName").textContent = "Tidak ada event dampak tinggi terjadwal"; $("kalNextWhen").textContent = ""; $("kalCount").textContent = ""; return; }
    $("kalNextName").textContent = nx.name;
    $("kalNextWhen").textContent = fmt(nx.ts, tz, { weekday: "long", day: "numeric", month: "long" }) + ", " + hhmm(nx.ts, tz) + " " + tzShort(tz);
    var s = Math.floor((nx.ts - now) / 1000), d = Math.floor(s / 86400); s -= d * 86400;
    var hh = Math.floor(s / 3600); s -= hh * 3600; var mm = Math.floor(s / 60); s -= mm * 60;
    var c = $("kalCount"); c.textContent = "";
    function seg(v, u) { c.appendChild(document.createTextNode(String(v).padStart(2, "0"))); c.appendChild(h("small", "", u)); }
    if (d) seg(d, "h"); seg(hh, "j"); seg(mm, "m"); seg(s, "d");
  }

  $("kalAddForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = $("kalName").value.trim(), date = $("kalDate").value, time = $("kalTime").value;
    if (!name || !date || !time) return;
    var ts = zonedToUtc(date, time, state.tz);
    manual.push({ id: "m-" + Date.now(), ts: ts, t: new Date(ts).toISOString(), cur: ($("kalCur").value.trim() || "USD").toUpperCase(), name: name, impact: +$("kalImp").value });
    save("kal-manual", manual);
    $("kalName").value = ""; render(); tick();
  });

  // API untuk bagian jurnal lain (Ringkasan, Laporan, peringatan jendela berita).
  function countdownText(ms) {
    var m = Math.max(0, Math.floor(ms / 60000));
    if (m < 60) return m + " menit";
    var hh = Math.floor(m / 60);
    if (hh < 48) return hh + " jam " + (m % 60) + " menit";
    return Math.floor(hh / 24) + " hari " + (hh % 24) + " jam";
  }
  var builtIn = EVENTS.map(function (x) { return Date.parse(x.t); });
  window.KAL = {
    events: allEvents,
    cover: { from: Math.min.apply(null, builtIn), to: Math.max.apply(null, builtIn) },
    nextHigh: function (now) { return allEvents().filter(function (e) { return e.impact === 3 && e.ts > now; })[0] || null; },
    // Event dampak tinggi yang waktunya berada dalam [ms - beforeMin, ms + afterMin] (rilis sebelum/sesudah titik waktu).
    near: function (ms, beforeMin, afterMin) {
      return allEvents().filter(function (e) { return e.impact === 3 && e.ts - ms <= beforeMin * 60000 && ms - e.ts <= afterMin * 60000; })[0] || null;
    },
    when: function (ts) { return fmt(ts, state.tz, { weekday: "long", day: "numeric", month: "long" }) + ", " + hhmm(ts, state.tz) + " " + tzShort(state.tz); },
    hm: function (ts) { return hhmm(ts, state.tz) + " " + tzShort(state.tz); },
    countdown: countdownText
  };
  buildControls(); render(); tick();
  window.dispatchEvent(new Event("kalReady"));
  // Jam dan daftar hanya diperbarui saat tab Kalender terbuka; daftar tidak dibangun ulang saat kolom isian sedang diketik.
  var panel = document.getElementById("tabpanel-kalender");
  function active() { return !panel || panel.classList.contains("active"); }
  setInterval(function () { if (active()) tick(); }, 1000);
  setInterval(function () {
    var a = document.activeElement;
    if (active() && !(a && a.tagName === "INPUT" && panel.contains(a))) render();
  }, 60000);
  document.querySelectorAll('[data-tab="kalender"]').forEach(function (b) { b.addEventListener("click", function () { render(); tick(); }); });
})();
