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
    { id: "nfp-2026-11", t: "2026-11-06T13:30:00Z", cur: "USD", name: "Nonfarm Payrolls (data Oktober)", impact: 3, status: "est", gold: "Data tenaga kerja kuat cenderung menguatkan USD dan menekan emas; data lemah mendukung emas." },
    { id: "cpi-2026-11", t: "2026-11-10T13:30:00Z", cur: "USD", name: "CPI Inflasi Konsumen (data Oktober)", impact: 3, status: "est", gold: GOLD_CPI },
    { id: "jc-2026-11-12", t: "2026-11-12T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "est", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "ppi-2026-11", t: "2026-11-13T13:30:00Z", cur: "USD", name: "PPI Inflasi Produsen (data Oktober)", impact: 2, status: "est", gold: "Dilihat sebagai petunjuk tekanan harga di hulu setelah CPI." },
    { id: "fomc-min-2026-11", t: "2026-11-18T19:00:00Z", cur: "USD", name: "Risalah Rapat FOMC (rapat Oktober)", impact: 2, status: "est", gold: "Risalah menunjukkan arah pembahasan suku bunga. Nada hawkish menekan emas, nada dovish mendukungnya." },
    { id: "jc-2026-11-19", t: "2026-11-19T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "est", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "jolts-2026-12", t: "2026-12-01T15:00:00Z", cur: "USD", name: "Lowongan Kerja JOLTS (data Oktober)", impact: 2, status: "est", gold: "Ukuran permintaan tenaga kerja; angka kuat mendukung USD." },
    { id: "jc-2026-12-03", t: "2026-12-03T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "est", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "nfp-2026-12", t: "2026-12-04T13:30:00Z", cur: "USD", name: "Nonfarm Payrolls (data November)", impact: 3, status: "est", gold: "Data tenaga kerja kuat cenderung menguatkan USD dan menekan emas; data lemah mendukung emas." },
    { id: "fomc-2026-12", t: "2026-12-09T19:00:00Z", cur: "USD", name: "Keputusan Suku Bunga FOMC (rapat 8-9 Des)", impact: 3, status: "est", gold: "Keputusan suku bunga dan proyeksi The Fed adalah penggerak utama emas; nada hawkish menekan, dovish mendukung." },
    { id: "cpi-2026-12", t: "2026-12-10T13:30:00Z", cur: "USD", name: "CPI Inflasi Konsumen (data November)", impact: 3, status: "est", gold: GOLD_CPI },
    { id: "jc-2026-12-10", t: "2026-12-10T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "est", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "ppi-2026-12", t: "2026-12-15T13:30:00Z", cur: "USD", name: "PPI Inflasi Produsen (data November)", impact: 2, status: "est", gold: "Dilihat sebagai petunjuk tekanan harga di hulu setelah CPI." },
    { id: "jc-2026-12-17", t: "2026-12-17T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan", impact: 1, status: "est", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "ism-svc-2026-11", t: "2026-11-04T15:00:00Z", cur: "USD", name: "ISM PMI Jasa", impact: 2, status: "est", gold: "Sektor jasa adalah porsi terbesar ekonomi AS; di bawah 50 berarti kontraksi. Komponen harga ikut diperhatikan." },
    { id: "ret-2026-11", t: "2026-11-17T13:30:00Z", cur: "USD", name: "Penjualan Ritel (data Oktober)", impact: 2, status: "est", gold: "Ukuran belanja konsumen. Angka kuat mendukung USD, angka lemah mendukung emas." },
    { id: "gdp-2026-11", t: "2026-11-25T13:30:00Z", cur: "USD", name: "PDB Kuartal III, estimasi kedua", impact: 2, status: "ok", gold: "Revisi atas estimasi awal. Pengaruh lebih kecil dari estimasi pertama kecuali revisinya besar." },
    { id: "pce-2026-11", t: "2026-11-25T13:30:00Z", cur: "USD", name: "PCE Inti dan Belanja Pribadi (data Oktober)", impact: 3, status: "ok", gold: "Ukuran inflasi yang diacu Fed. Reaksinya mirip CPI." },
    { id: "jc-2026-11-25", t: "2026-11-25T13:30:00Z", cur: "USD", name: "Klaim Pengangguran Mingguan (dimajukan karena Thanksgiving)", impact: 1, status: "est", gold: "Rilis rutin tiap Kamis. Pengaruh kecil kecuali angkanya jauh dari ekspektasi." },
    { id: "ism-2026-12", t: "2026-12-01T15:00:00Z", cur: "USD", name: "ISM PMI Manufaktur", impact: 2, status: "est", gold: "Di bawah 50 berarti kontraksi sektor manufaktur." },
    { id: "ism-svc-2026-12", t: "2026-12-03T15:00:00Z", cur: "USD", name: "ISM PMI Jasa", impact: 2, status: "est", gold: "Sektor jasa adalah porsi terbesar ekonomi AS; di bawah 50 berarti kontraksi. Komponen harga ikut diperhatikan." },
    { id: "ret-2026-12", t: "2026-12-16T13:30:00Z", cur: "USD", name: "Penjualan Ritel (data November)", impact: 2, status: "est", gold: "Ukuran belanja konsumen. Angka kuat mendukung USD, angka lemah mendukung emas." },
    { id: "gdp-2026-12", t: "2026-12-23T13:30:00Z", cur: "USD", name: "PDB Kuartal III, estimasi ketiga", impact: 1, status: "ok", gold: "Revisi akhir; biasanya berpengaruh kecil." },
    { id: "pce-2026-12", t: "2026-12-23T13:30:00Z", cur: "USD", name: "PCE Inti dan Belanja Pribadi (data November)", impact: 3, status: "ok", gold: "Ukuran inflasi yang diacu Fed. Reaksinya mirip CPI." },
    { id: "fomc-min-2026-12", t: "2026-12-30T19:00:00Z", cur: "USD", name: "Risalah Rapat FOMC (rapat Desember)", impact: 2, status: "est", gold: "Risalah menunjukkan arah pembahasan suku bunga. Nada hawkish menekan emas, nada dovish mendukungnya." },
    { id: "ecb-2026-10", t: "2026-10-29T13:15:00Z", cur: "EUR", name: "Keputusan Suku Bunga ECB (rapat 28-29 Okt)", impact: 2, status: "ok", gold: "Keputusan ECB menggerakkan EUR, yang bobotnya besar di indeks dolar. Nada hawkish menguatkan EUR dan cenderung menekan USD (mendukung emas); konferensi pers sekitar 30 menit kemudian sering membuat harga bergerak liar." },
    { id: "boj-2026-10", t: "2026-10-30T03:00:00Z", cur: "JPY", name: "Keputusan Suku Bunga BoJ (rapat 29-30 Okt)", impact: 2, status: "est", gold: "Jam pengumuman BoJ tidak dijadwalkan pasti (biasanya sekitar tengah hari waktu Tokyo, 03:00 UTC); tanggal rapat sudah resmi. Kenaikan suku bunga atau nada hawkish menguatkan yen dan bisa melemahkan USD." },
    { id: "boe-2026-11", t: "2026-11-05T12:00:00Z", cur: "GBP", name: "Keputusan Suku Bunga BoE (MPC) dan Laporan Kebijakan Moneter", impact: 2, status: "ok", gold: "Keputusan MPC dan pemungutan suara internal menggerakkan GBP dan indeks dolar. Laporan Kebijakan Moneter terbit bersamaan sehingga volatilitas biasanya tinggi di sekitar pengumuman." },
    { id: "ecb-2026-12", t: "2026-12-17T13:15:00Z", cur: "EUR", name: "Keputusan Suku Bunga ECB (rapat 16-17 Des)", impact: 2, status: "ok", gold: "Keputusan ECB menggerakkan EUR dan indeks dolar; proyeksi staf baru terbit pada rapat Desember. Konferensi pers sekitar 30 menit setelah keputusan." },
    { id: "boe-2026-12", t: "2026-12-17T12:00:00Z", cur: "GBP", name: "Keputusan Suku Bunga BoE (MPC)", impact: 2, status: "ok", gold: "Keputusan MPC dan pemungutan suara internal menggerakkan GBP dan indeks dolar." },
    { id: "boj-2026-12", t: "2026-12-18T03:00:00Z", cur: "JPY", name: "Keputusan Suku Bunga BoJ (rapat 17-18 Des)", impact: 2, status: "est", gold: "Jam pengumuman BoJ tidak dijadwalkan pasti (sekitar 03:00 UTC); tanggal rapat sudah resmi. Kenaikan suku bunga atau nada hawkish menguatkan yen dan bisa melemahkan USD." },
  ];

  // Zona waktu awal mengikuti Setelan jurnal (jurnalTzOffset, menit) bila belum ada pilihan tersimpan.
  function defaultTz() {
    var o; try { o = +localStorage.getItem("jurnalTzOffset"); } catch (e) {}
    return { 180: "Etc/GMT-3", 420: "Asia/Jakarta", 480: "Asia/Makassar", 540: "Asia/Jayapura" }[o] || "Asia/Makassar";
  }
  var IMPACT_LABEL = { 3: "Tinggi", 2: "Sedang", 1: "Rendah" };
  var REACT = { naik: "\u2191", turun: "\u2193", datar: "\u2192" };   // catatan reaksi emas per event (kal-notes: r = arah, c = catatan)
  var RANGES = [{ k: 7, l: "7 hari" }, { k: 30, l: "30 hari" }, { k: 0, l: "Semua" }];
  var state = { tz: defaultTz(), imp: { 1: true, 2: true, 3: true }, range: 30, past: false, view: "daftar" };
  var weekOff = 0, selEv = null;   // pergeseran minggu (0 = minggu ini) dan event terpilih di tampilan mingguan
  var manual = [], notes = {}, open = {};

  function load(key, fallback) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  var prefs = load("kal-prefs", null);
  if (prefs) { for (var k in prefs) if (k in state) state[k] = prefs[k]; }
  if (state.view !== "daftar" && state.view !== "minggu") state.view = "daftar";
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

    var vc = $("kalViewChips");
    if (vc) {
      vc.textContent = "";
      [["daftar", "Daftar"], ["minggu", "Mingguan"]].forEach(function (v) {
        var b = h("button", "kal-chip", v[1]); b.type = "button"; b.dataset.v = v[0];
        b.setAttribute("aria-pressed", String(state.view === v[0]));
        b.addEventListener("click", function () {
          state.view = v[0];
          vc.querySelectorAll(".kal-chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.v === state.view)); });
          persist(); render();
        });
        vc.appendChild(b);
      });
    }
    var pc = $("kalPastChip"); pc.setAttribute("aria-pressed", String(state.past));
    pc.addEventListener("click", function () { state.past = !state.past; pc.setAttribute("aria-pressed", String(state.past)); persist(); render(); });

  }
  function persist() { save("kal-prefs", state); }

  // Isian angka: catatan pengguna (notes) menang atas nilai bawaan di EVENTS (f = prakiraan, p = sebelumnya); mengosongkan kolom berarti kosong.
  function byId(id) { return allEvents().filter(function (x) { return x.id === id; })[0] || {}; }
  function val(e, key) { var n = notes[e.id]; return n && n[key] !== undefined ? n[key] : (e[key] || ""); }
  // Angka pertama dalam teks isian ("3,7% y/y", "200K", "-0,2%") sebagai angka; null bila tidak ada. K/M/B dikalikan.
  function num(t) {
    var m = /(-?\d+(?:[.,]\d+)?)\s*([KMBkmb])?/.exec(String(t || "").replace(/\s/g, ""));
    if (!m) return null;
    var v = parseFloat(m[1].replace(",", ".")), u = (m[2] || "").toUpperCase();
    return v * (u === "K" ? 1e3 : u === "M" ? 1e6 : u === "B" ? 1e9 : 1);
  }
  // Aktual dibanding Prakiraan: panah dan kata. Hanya penanda arah angka, bukan penilaian pengaruh ke emas (itu tergantung jenis data).
  function surprise(e) {
    var a = num(val(e, "a")), f = num(val(e, "f"));
    if (a === null || f === null) return "";
    return a > f ? " \u25b2 di atas prakiraan" : a < f ? " \u25bc di bawah prakiraan" : " = sesuai prakiraan";
  }
  function valsLine(id) {
    var parts = [], e = byId(id);
    if (val(e, "a")) parts.push("Aktual " + val(e, "a") + surprise(e));
    if (val(e, "f")) parts.push("Prakiraan " + val(e, "f"));
    if (val(e, "p")) parts.push("Sebelumnya " + val(e, "p"));
    return parts.join("  ·  ");
  }

  function render() {
    var now = Date.now(), tz = state.tz, list = $("kalList");
    list.textContent = "";
    document.querySelectorAll(".kal-only-list").forEach(function (g) { g.hidden = state.view === "minggu"; });
    // Peringatan jadwal hampir habis: event bawaan terakhir kurang dari 7 hari lagi (atau sudah lewat).
    var st = $("kalStale"), lastTs = Math.max.apply(null, allEvents().map(function (x) { return x.ts; }));
    if (st) {
      st.hidden = lastTs - now > 7 * 86400000;
      if (!st.hidden) st.textContent = (lastTs < now ? "Jadwal bawaan sudah berakhir pada " : "Jadwal bawaan segera berakhir pada ") + fmt(lastTs, tz, { day: "numeric", month: "long", year: "numeric" }) + ". Impor jadwal baru (JSON) atau tambah event sendiri di bawah, atau perbarui array EVENTS di kalender.js (lihat README).";
    }
    if (state.view === "minggu") { renderWeek(list, now, tz); return; }
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

  // Tampilan mingguan (v1.1.182): grid Senin sampai Jumat menurut zona waktu terpilih; ketuk event untuk rincian di bawah grid.
  function addDays(key, n) { var p = key.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return d.toISOString().slice(0, 10); }
  function mondayOf(key) { var p = key.split("-").map(Number), wd = (new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay() + 6) % 7; return addDays(key, -wd); }
  function renderWeek(list, now, tz) {
    var monday = addDays(mondayOf(dayKey(now, tz)), weekOff * 7), days = [0, 1, 2, 3, 4].map(function (i) { return addDays(monday, i); });
    var today = dayKey(now, tz), all = allEvents().filter(function (e) { return state.imp[e.impact]; });
    var byDay = {}; days.forEach(function (d) { byDay[d] = []; });
    var weekend = 0;
    all.forEach(function (e) { var k = dayKey(e.ts, tz); if (byDay[k]) byDay[k].push(e); else if (k > days[4] && k <= addDays(monday, 6)) weekend++; });
    var head = h("div", "kalw-head");
    var prev = h("button", "kal-chip", "\u25c0"); prev.type = "button"; prev.setAttribute("aria-label", "Minggu sebelumnya");
    var next = h("button", "kal-chip", "\u25b6"); next.type = "button"; next.setAttribute("aria-label", "Minggu berikutnya");
    var cur = h("button", "kal-chip", "Minggu ini"); cur.type = "button";
    prev.addEventListener("click", function () { weekOff--; selEv = null; render(); });
    next.addEventListener("click", function () { weekOff++; selEv = null; render(); });
    cur.addEventListener("click", function () { weekOff = 0; selEv = null; render(); });
    var lbl = h("div", "kalw-range", fmt(zonedToUtc(days[0], "12:00", tz), tz, { day: "numeric", month: "short" }) + " \u2013 " + fmt(zonedToUtc(days[4], "12:00", tz), tz, { day: "numeric", month: "short", year: "numeric" }));
    head.appendChild(prev); head.appendChild(lbl); head.appendChild(next); head.appendChild(cur);
    list.appendChild(head);
    var grid = h("div", "kalw-grid");
    days.forEach(function (d) {
      var col = h("div", "kalw-col" + (d === today ? " kalw-today" : ""));
      var ts = zonedToUtc(d, "12:00", tz);
      var hd = h("div", "kalw-dh"); hd.appendChild(h("span", "kalw-dn", fmt(ts, tz, { weekday: "short" })));
      hd.appendChild(h("span", "kalw-dd", fmt(ts, tz, { day: "numeric", month: "short" })));
      col.appendChild(hd);
      var evs = byDay[d];
      if (!evs.length) col.appendChild(h("div", "kalw-none", "\u2013"));
      evs.forEach(function (e) {
        var b = h("button", "kalw-ev l" + e.impact + (e.ts < now ? " kalw-past" : "") + (selEv === e.id ? " kalw-sel" : ""));
        b.type = "button"; b.title = e.name;
        b.appendChild(h("span", "kalw-t", hhmm(e.ts, tz)));
        b.appendChild(h("span", "kalw-n", e.cur + " " + e.name));
        b.addEventListener("click", function () { selEv = selEv === e.id ? null : e.id; if (selEv) open[e.id] = true; render(); });
        col.appendChild(b);
      });
      grid.appendChild(col);
    });
    list.appendChild(grid);
    if (weekend) list.appendChild(h("div", "section-note", weekend + " event jatuh di akhir pekan dan hanya tampil di Daftar."));
    var sel = selEv && all.filter(function (e) { return e.id === selEv; })[0];
    if (sel) { var box = h("div", "kalw-detail"); box.appendChild(eventNode(sel, now, tz)); list.appendChild(box); }
    else if (!all.some(function (e) { return byDay[dayKey(e.ts, tz)]; })) list.appendChild(h("div", "kal-empty", "Tidak ada event pada minggu ini untuk filter dampak yang dipilih."));
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
    if (e.status === "est" && e.ts > now && e.ts - now < 7 * 86400000) meta.appendChild(h("span", "kal-badge kal-check", "Perlu dicek"));
    { var rn = notes[e.id] && notes[e.id].r; if (rn && REACT[rn]) meta.appendChild(h("span", "kal-badge kal-react-b " + rn, "Emas " + REACT[rn])); }
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
      var rx = h("div", "kal-react"); rx.appendChild(h("span", "kal-lbl", "Reaksi emas (catatan Anda)"));
      var rb = h("div", "kal-react-btns");
      Object.keys(REACT).forEach(function (rk) {
        var b = h("button", "kal-chip", REACT[rk] + " " + rk); b.type = "button"; b.dataset.r = rk;
        var cur = notes[e.id] && notes[e.id].r; b.setAttribute("aria-pressed", String(cur === rk));
        b.addEventListener("click", function (ev) {
          ev.stopPropagation(); notes[e.id] = notes[e.id] || {};
          if (notes[e.id].r === rk) delete notes[e.id].r; else notes[e.id].r = rk;
          save("kal-notes", notes); render();
        });
        rb.appendChild(b);
      });
      rx.appendChild(rb);
      var ci = h("input", "settings-input"); ci.type = "text"; ci.id = "kal-in-c-" + e.id; ci.maxLength = 60; ci.autocomplete = "off";
      ci.placeholder = "Catatan reaksi harga (maks. 60 huruf), mis. naik 12 USD lalu balik"; ci.value = (notes[e.id] && notes[e.id].c) || "";
      ci.addEventListener("change", function () { notes[e.id] = notes[e.id] || {}; var v = ci.value.trim().slice(0, 60); if (v) notes[e.id].c = v; else delete notes[e.id].c; save("kal-notes", notes); render(); });
      ci.addEventListener("click", function (ev) { ev.stopPropagation(); });
      rx.appendChild(ci); d.appendChild(rx);
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

  // Impor/ekspor jadwal (v1.1.181): JSON {app:'jurnal-xauusd', type:'kalender', events:[{id,t,cur,name,impact,status,f,p,a,gold}]}.
  function ioNote(msg, bad) { var n = $("kalIoNote"); if (!n) return; n.hidden = !msg; n.textContent = msg || ""; n.style.color = bad ? "var(--loss)" : ""; }
  function strOr(v, max) { return typeof v === "string" ? v.trim().slice(0, max) : ""; }
  function normalizeEvent(x) {
    if (!x || typeof x !== "object") return null;
    var name = strOr(x.name, 120), ts = Date.parse(x.t);
    if (!name || isNaN(ts)) return null;
    var imp = +x.impact; if ([1, 2, 3].indexOf(imp) < 0) return null;
    var cur = strOr(x.cur, 4).toUpperCase(); if (!/^[A-Z]{2,4}$/.test(cur)) cur = "USD";
    var id = strOr(x.id, 60).replace(/[^\w.\-]/g, "") || "i-" + ts + "-" + Math.abs(hash(name));
    var ev = { id: id, ts: ts, t: new Date(ts).toISOString(), cur: cur, name: name, impact: imp, status: x.status === "ok" ? "ok" : "est" };
    ["f", "p", "a"].forEach(function (key) { var v = strOr(x[key], 60); if (v) ev[key] = v; });
    var g = strOr(x.gold, 400); if (g) ev.gold = g;
    return ev;
  }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function exportSchedule() {
    var evs = allEvents().map(function (e) {
      var o = { id: e.id, t: new Date(e.ts).toISOString(), cur: e.cur, name: e.name, impact: e.impact, status: e.status === "ok" ? "ok" : "est", gold: e.gold };
      ["f", "p", "a"].forEach(function (key) { var v = val(e, key); if (v) o[key] = v; });
      return o;
    });
    var d = new Date(), stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    var body = JSON.stringify({ app: "jurnal-xauusd", type: "kalender", version: 1, events: evs }, null, 2);
    if (typeof downloadTextFile === "function") downloadTextFile("jurnal-xauusd-kalender-" + stamp + ".json", body, "application/json;charset=utf-8;");
    ioNote(evs.length + " event diekspor.");
  }
  function importSchedule(text) {
    var obj; try { obj = JSON.parse(text); } catch (e) { ioNote("Berkas bukan JSON yang valid.", true); return; }
    var list = Array.isArray(obj) ? obj : (obj && obj.type === "kalender" && Array.isArray(obj.events) ? obj.events : null);
    if (!list) { ioNote("Ini bukan berkas jadwal kalender. Pakai hasil Ekspor jadwal, atau larik event.", true); return; }
    if (list.length > 300) { ioNote("Terlalu banyak event (maksimal 300 per berkas).", true); return; }
    var builtIn = {}; EVENTS.forEach(function (e) { builtIn[e.id] = 1; });
    var added = 0, updated = 0, skipped = 0, bad = 0, byId = {};
    manual.forEach(function (m) { byId[m.id] = m; });
    list.forEach(function (x) {
      var ev = normalizeEvent(x); if (!ev) { bad++; return; }
      if (builtIn[ev.id]) { skipped++; return; }
      if (byId[ev.id]) { var i = manual.indexOf(byId[ev.id]); manual[i] = ev; byId[ev.id] = ev; updated++; return; }
      if (manual.length >= 200) { bad++; return; }
      manual.push(ev); byId[ev.id] = ev; added++;
    });
    save("kal-manual", manual); render(); tick(); window.dispatchEvent(new Event("kalChanged"));
    ioNote(added + " ditambah, " + updated + " diperbarui" + (skipped ? ", " + skipped + " event bawaan dilewati" : "") + (bad ? ", " + bad + " tidak valid diabaikan" : "") + ".", !added && !updated);
  }
  (function () {
    var ex = $("kalExportBtn"), im = $("kalImportBtn"), inp = $("kalImportInput");
    if (ex) ex.addEventListener("click", exportSchedule);
    if (im && inp) {
      im.addEventListener("click", function () { inp.click(); });
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0]; inp.value = "";
        if (!f) return;
        if (f.size > 1024 * 1024) { ioNote("Berkas terlalu besar.", true); return; }
        var r = new FileReader(); r.onload = function () { importSchedule(String(r.result)); }; r.onerror = function () { ioNote("Berkas tidak bisa dibaca.", true); }; r.readAsText(f);
      });
    }
  })();

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
    near: function (ms, beforeMin, afterMin, minImpact) {
      var mi = minImpact === 2 ? 2 : 3;
      return allEvents().filter(function (e) { return e.impact >= mi && e.ts - ms <= beforeMin * 60000 && ms - e.ts <= afterMin * 60000; })[0] || null;
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
