// Rekonsiliasi dengan broker (v1.1.175): impor riwayat MT5 (XLSX/CSV), cek saldo, pemeriksaan data, urungkan impor.
// Berdiri sendiri: hanya memakai id/kelas berawalan "bk"/"dc" dan fungsi global app.js (DATA, mergeImportedData, saveActiveData,
// showConfirmModal, queueNotifyAfterReload, serverToGmt8Iso, recomputeAll). Tanpa library: XLSX dibaca dengan unzip + DecompressionStream.
(function () {
  "use strict";
  var UNDO_KEY = "jurnalUndoSnapshot", SALDO_KEY = "jurnalBrokerSaldo";
  var CENT = 100; // akun cent: 0.001 lot di riwayat = 0.1 lot di jurnal
  var BROKER_OFFSET_H = 5; // jam broker (GMT+3) -> GMT+8

  function r2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function fc(n) { return n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "¢"; }
  function sgn(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + fc(Math.abs(n)); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function isoOf(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()); }
  function plus5(iso) { return isoOf(new Date(Date.parse(iso + "Z") + BROKER_OFFSET_H * 3600000)); }
  function norm(s) { return String(s == null ? "" : s).replace(" ", "T"); }
  function ms(s) { return Date.parse(norm(s) + "Z"); }

  // ---------- Pembaca XLSX (zip + XML) ----------
  async function unzipEntries(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), eocd = -1;
    for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error("Bukan berkas XLSX yang valid (bukan ZIP).");
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), files = {};
    for (var k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      files[new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen))] = { method: method, csize: csize, lo: lo };
      p += 46 + nlen + elen + clen;
    }
    return files;
  }
  async function readEntry(buf, e) {
    var dv = new DataView(buf), start = e.lo + 30 + dv.getUint16(e.lo + 26, true) + dv.getUint16(e.lo + 28, true);
    var data = new Uint8Array(buf, start, e.csize);
    if (e.method === 0) return data;
    if (e.method !== 8) throw new Error("Kompresi ZIP tidak didukung.");
    if (typeof DecompressionStream === "undefined") throw new Error("Browser ini belum mendukung membaca XLSX. Simpan sebagai CSV lalu impor lagi.");
    var stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  function xml(u8) { return new DOMParser().parseFromString(new TextDecoder().decode(u8), "application/xml"); }
  function colIdx(ref) { var m = /^([A-Z]+)/.exec(ref || ""), n = 0; if (!m) return 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + m[1].charCodeAt(i) - 64; return n - 1; }
  function els(node, name) { return Array.prototype.slice.call(node.getElementsByTagNameNS("*", name)); }

  async function parseXlsx(buf) {
    var files = await unzipEntries(buf);
    var get = async function (name) { return files[name] ? xml(await readEntry(buf, files[name])) : null; };
    var sst = [], ss = await get("xl/sharedStrings.xml");
    if (ss) els(ss, "si").forEach(function (si) { sst.push(els(si, "t").filter(function (t) { return !t.parentNode || t.parentNode.localName !== "rPh"; }).map(function (t) { return t.textContent; }).join("")); });
    var sheetPath = null, wb = await get("xl/workbook.xml"), rels = await get("xl/_rels/workbook.xml.rels");
    if (wb && rels) {
      var sh = els(wb, "sheet")[0], rid = sh && (sh.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || sh.getAttribute("r:id"));
      var rel = els(rels, "Relationship").filter(function (r) { return r.getAttribute("Id") === rid; })[0];
      if (rel) { var t = rel.getAttribute("Target"); sheetPath = t.charAt(0) === "/" ? t.slice(1) : "xl/" + t; }
    }
    if (!sheetPath || !files[sheetPath]) sheetPath = Object.keys(files).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
    if (!sheetPath) throw new Error("Lembar kerja tidak ditemukan di berkas XLSX.");
    var doc = xml(await readEntry(buf, files[sheetPath])), rows = [];
    els(doc, "row").forEach(function (row) {
      var arr = [];
      els(row, "c").forEach(function (c) {
        var t = c.getAttribute("t"), v = els(c, "v")[0], val = null;
        if (t === "inlineStr") val = els(c, "t").map(function (x) { return x.textContent; }).join("");
        else if (v) val = t === "s" ? (sst[+v.textContent] != null ? sst[+v.textContent] : "") : v.textContent;
        arr[colIdx(c.getAttribute("r"))] = val;
      });
      rows.push(arr);
    });
    return rows;
  }

  // ---------- Pembaca CSV ----------
  function parseCsv(text) {
    text = text.replace(/^﻿/, "");
    var first = text.split(/\r?\n/, 1)[0], delim = ",", best = 0;
    [",", ";", "\t"].forEach(function (d) { var c = first.split(d).length; if (c > best) { best = c; delim = d; } });
    var rows = [], row = [], cur = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some(function (x) { return x !== ""; })) rows.push(row); row = []; }
      else cur += ch;
    }
    row.push(cur); if (row.some(function (x) { return x !== ""; })) rows.push(row);
    return rows;
  }

  // ---------- Pemetaan kolom riwayat broker ----------
  var COLS = {
    open: ["open date", "waktu buka", "tanggal buka", "open time"],
    close: ["close date", "waktu tutup", "tanggal tutup", "close time"],
    id: ["position id", "position", "id posisi", "ticket"],
    sym: ["simbol", "symbol"],
    act: ["tindakan", "action", "type", "tipe"],
    lot: ["banyak", "volume", "lot", "lots"],
    po: ["harga pembukaan", "open price", "price open"],
    pc: ["harga penutupan", "close price", "price close"],
    laba: ["laba", "profit", "p/l"]
  };
  function num(v) {
    if (typeof v === "number") return v;
    var s = String(v == null ? "" : v).replace(/[\s ]/g, "");
    if (s === "" || s === "-") return NaN;
    if (s.indexOf(",") >= 0 && s.indexOf(".") >= 0) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (s.indexOf(",") >= 0) s = s.replace(",", ".");
    return parseFloat(s);
  }
  function dateIso(v) {
    if (v == null) return null;
    if (typeof v === "number" || /^\d+(\.\d+)?$/.test(String(v).trim())) { var n = +v; if (n > 20000 && n < 80000) return isoOf(new Date(Math.round((n - 25569) * 86400) * 1000)); return null; }
    var m = /^(\d{4})[-.\/](\d{2})[-.\/](\d{2})[T\s]+(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(v).trim());
    return m ? m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":" + (m[6] || "00") : null;
  }

  // rows (array of arrays) -> { positions, openOnly, skipped, error }
  function groupBrokerRows(rows) {
    var hi = -1, map = {};
    for (var i = 0; i < Math.min(rows.length, 15) && hi < 0; i++) {
      var cells = (rows[i] || []).map(function (c) { return String(c == null ? "" : c).trim().toLowerCase(); });
      if (cells.some(function (c) { return COLS.id.indexOf(c) >= 0; }) && cells.some(function (c) { return COLS.close.indexOf(c) >= 0; })) {
        hi = i;
        Object.keys(COLS).forEach(function (k) { for (var j = 0; j < cells.length; j++) if (COLS[k].indexOf(cells[j]) >= 0) { map[k] = j; break; } });
      }
    }
    if (hi < 0) return { error: "Kolom riwayat broker tidak ditemukan. Gunakan laporan \"Trading activity\" MT5 (kolom Open Date, Close Date, Position ID, Simbol, Tindakan, Banyak, Harga Pembukaan, Harga Penutupan, Laba)." };
    var need = ["open", "close", "id", "act", "lot", "po", "pc", "laba"], miss = need.filter(function (k) { return map[k] == null; });
    if (miss.length) return { error: "Kolom wajib tidak ditemukan: " + miss.join(", ") + "." };
    var by = {}, order = [], openIds = {}, skipped = { bukanXau: 0, bukanCent: 0, tidakValid: 0 };
    for (var r = hi + 1; r < rows.length; r++) {
      var row = rows[r] || [], id = String(row[map.id] == null ? "" : row[map.id]).trim();
      if (!id) continue;
      var sym = map.sym != null ? String(row[map.sym] || "").trim() : "XAUUSDc";
      if (!/^xau/i.test(sym)) { skipped.bukanXau++; continue; }
      if (!/c$/.test(sym)) { skipped.bukanCent++; continue; }
      var close = dateIso(row[map.close]);
      if (!close) { openIds[id] = true; continue; }
      var open = dateIso(row[map.open]), act = String(row[map.act] || "").trim().toLowerCase(),
          lot = num(row[map.lot]), po = num(row[map.po]), pc = num(row[map.pc]), laba = num(row[map.laba]);
      if (!open || !(act === "buy" || act === "sell" || act === "beli" || act === "jual") || !(lot > 0) || !isFinite(po) || !isFinite(pc) || !isFinite(laba)) { skipped.tidakValid++; continue; }
      var closeBuy = act === "buy" || act === "beli"; // baris penutupan: aksi penutupnya kebalikan arah posisi
      var part = { id: id, arah: closeBuy ? "Jual" : "Beli", lot: Math.round(lot * CENT * 10000) / 10000, buka: po, tutup: pc, pips: 0, laba: r2(laba),
                   tanggal: close, tanggal_gmt8: plus5(close), waktu_buka: plus5(open) };
      if (!by[id]) { by[id] = []; order.push(id); }
      by[id].push(part);
    }
    var positions = order.map(function (id) { return by[id].length > 1 ? combinePartialTrades(by[id]) : finish(by[id][0]); });
    var openOnly = Object.keys(openIds).filter(function (id) { return !by[id]; }).length;
    return { positions: positions, openOnly: openOnly, skipped: skipped };
  }
  function finish(t) { t.pips = Math.round(t.laba / (t.lot * 10) * 10) / 10; return t; }

  // Gabungkan beberapa bagian penutupan satu posisi menjadi satu transaksi: lot dijumlah, harga tutup rata-rata berbobot lot,
  // laba dijumlah, waktu tutup = bagian terakhir, waktu buka = paling awal. Field lain (trigger, emosi, catatan) dari bagian pertama.
  function combinePartialTrades(parts) {
    var base = JSON.parse(JSON.stringify(parts[0])), lot = 0, wsum = 0, laba = 0, parts_n = 0, last = parts[0], first = null;
    parts.forEach(function (p) {
      lot += +p.lot; wsum += +p.tutup * +p.lot; laba += +p.laba; parts_n += +p.bagian || 1;
      if (ms(p.tanggal_gmt8) >= ms(last.tanggal_gmt8)) last = p;
      if (p.waktu_buka && (!first || ms(p.waktu_buka) < ms(first))) first = p.waktu_buka;
    });
    base.lot = Math.round(lot * 10000) / 10000;
    base.tutup = r2(wsum / lot);
    base.laba = r2(laba);
    base.tanggal = last.tanggal; base.tanggal_gmt8 = last.tanggal_gmt8;
    base.waktu_buka = first || base.waktu_buka || "";
    base.bagian = parts_n;
    base.pips = Math.round(base.laba / (base.lot * 10) * 10) / 10;
    return base;
  }

  // ---------- Bandingkan dengan jurnal ----------
  var CMP = [["arah", null], ["lot", 1e-6], ["buka", 0.001], ["tutup", 0.011], ["laba", 0.005], ["tanggal", null], ["tanggal_gmt8", null], ["waktu_buka", null]];
  function changedFields(old, nw) {
    var ch = [];
    CMP.forEach(function (c) {
      var k = c[0], a = old[k], b = nw[k];
      if (c[1] == null) { if (norm(a || "") !== norm(b || "")) ch.push(k); }
      else if (Math.abs((+a) - (+b)) > c[1] || !isFinite(+a)) ch.push(k);
    });
    return ch;
  }
  function compareWithJournal(positions, trades) {
    var byId = {}; trades.forEach(function (t) { byId[String(t.id)] = t; });
    var res = { fresh: [], diff: [], same: 0, bagian: [], plNew: 0, plFix: 0 };
    positions.forEach(function (p) {
      var old = byId[String(p.id)];
      if (!old) { res.fresh.push(p); res.plNew += p.laba; return; }
      var ch = changedFields(old, p);
      if (ch.length) { res.diff.push({ id: p.id, fields: ch, old: old, nw: p }); res.plFix += p.laba - old.laba; }
      else if (p.bagian > 1 && !(old.bagian > 1)) { res.bagian.push({ id: p.id, old: old, nw: p }); res.same++; }
      else res.same++;
    });
    res.plNew = r2(res.plNew); res.plFix = r2(res.plFix);
    return res;
  }
  // Daftar transaksi lengkap (siap dilempar ke mergeImportedData) untuk hasil perbandingan.
  function buildApplyList(cmp, onlyNew) {
    var list = cmp.fresh.slice();
    if (!onlyNew) {
      cmp.diff.concat(cmp.bagian).forEach(function (d) {
        var upd = {};
        (d.fields || []).forEach(function (k) { upd[k] = d.nw[k]; });
        if (d.nw.bagian > 1) upd.bagian = d.nw.bagian;
        if (d.fields && d.fields.indexOf("laba") >= 0) upd.pips = d.nw.pips;
        list.push(Object.assign({}, JSON.parse(JSON.stringify(d.old)), upd));
      });
    }
    return list;
  }

  // ---------- Pemeriksaan data ----------
  function checkDataIssues(trades) {
    var out = [], seen = {}, add = function (t, kind, level, text) { out.push({ id: t.id, kind: kind, level: level, text: text }); };
    trades.forEach(function (t) {
      var id = String(t.id);
      if (seen[id]) add(t, "id-dobel", "warn", "ID dobel di jurnal (" + id + ")."); seen[id] = true;
      var close = t.tanggal_gmt8, open = t.waktu_buka;
      if (!open) add(t, "buka-kosong", "info", "Jam buka kosong (statistik durasi dan sesi tidak bisa dihitung).");
      else if (ms(open) > ms(close)) add(t, "tutup-sebelum-buka", "warn", "Jam tutup lebih awal dari jam buka (" + norm(close).replace("T", " ") + " < " + norm(open).replace("T", " ") + "); kemungkinan zona waktu salah.");
      if (t.tanggal && t.tanggal_gmt8 && Math.abs(ms(t.tanggal_gmt8) - ms(t.tanggal) - BROKER_OFFSET_H * 3600000) > 1000) add(t, "gmt8-tak-sesuai", "warn", "Jam GMT+8 tidak sama dengan jam broker + 5 jam.");
      var dir = t.arah === "Beli" ? 1 : -1, exp = r2((t.tutup - t.buka) * dir * 100 * t.lot);
      if (Math.abs(exp) > 2 && Math.sign(exp) !== Math.sign(t.laba) && Math.abs(t.laba) > 0.005) add(t, "laba-tanda", "warn", "Tanda laba (" + sgn(t.laba) + ") berlawanan dengan arah dan harga (seharusnya " + sgn(exp) + ").");
      else if (Math.abs(t.laba - exp) > Math.max(5, Math.abs(exp) * 0.05)) add(t, "laba-beda-rumus", "info", "Laba " + sgn(t.laba) + " beda dari hitungan harga " + sgn(exp) + " (swap/komisi, atau penutupan bertahap, atau salah ketik).");
    });
    return out;
  }

  // ---------- Cadangan untuk Urungkan ----------
  function snapshot(label) {
    try {
      var d = (typeof DATA !== "undefined") ? DATA : null; if (!d) return false;
      localStorage.setItem(UNDO_KEY, JSON.stringify({ v: 1, label: label, ts: new Date().toISOString(), n: (d.trades || []).length, data: d }));
      return true;
    } catch (e) { return false; }
  }
  function snapshotInfo() { try { var s = JSON.parse(localStorage.getItem(UNDO_KEY)); return s && s.data ? s : null; } catch (e) { return null; } }
  function restoreSnapshot() {
    var s = snapshotInfo(); if (!s) return false;
    if (!saveActiveData(s.data)) return false;
    try { localStorage.removeItem(UNDO_KEY); } catch (e) {}
    return true;
  }

  function checkSaldo(brokerVal, d) {
    var j = d && d.dashboard && isFinite(d.dashboard.saldo) ? d.dashboard.saldo : (d && d.summary ? d.summary.saldo_akhir : 0);
    return { journal: r2(j), broker: r2(brokerVal), diff: r2(brokerVal - j) };
  }

  window.JTB = { parseXlsx: parseXlsx, parseCsv: parseCsv, groupBrokerRows: groupBrokerRows, combinePartialTrades: combinePartialTrades,
                 compareWithJournal: compareWithJournal, buildApplyList: buildApplyList, checkDataIssues: checkDataIssues, checkSaldo: checkSaldo,
                 snapshot: snapshot, snapshotInfo: snapshotInfo, restoreSnapshot: restoreSnapshot, fc: fc };

  // ---------- UI (Setelan -> Data -> Cocokkan dengan broker) ----------
  var $ = function (id) { return document.getElementById(id); };
  if (!$("brokerSection")) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function note(text, kind) { var n = $("brokerNote"); n.textContent = text || ""; n.style.color = kind === "err" ? "var(--loss)" : kind === "ok" ? "var(--gain)" : ""; }

  // Impor riwayat broker
  $("brokerImportBtn").addEventListener("click", function () { $("brokerFileInput").click(); });
  $("brokerFileInput").addEventListener("change", async function (e) {
    var file = e.target.files && e.target.files[0]; e.target.value = ""; if (!file) return;
    note("Membaca " + file.name + "...");
    var rows;
    try {
      rows = /\.csv$/i.test(file.name) ? parseCsv(await file.text()) : await parseXlsx(await file.arrayBuffer());
    } catch (err) { note("Gagal membaca file: " + err.message, "err"); return; }
    var g = groupBrokerRows(rows);
    if (g.error) { note(g.error, "err"); return; }
    if (!g.positions.length) { note("Tidak ada posisi tertutup XAUUSD di file ini.", "err"); return; }
    var cmp = compareWithJournal(g.positions, DATA.trades), multi = g.positions.filter(function (p) { return p.bagian > 1; }).length;
    var skip = g.skipped, skipTxt = [];
    if (skip.bukanXau) skipTxt.push(skip.bukanXau + " baris bukan XAUUSD");
    if (skip.bukanCent) skipTxt.push(skip.bukanCent + " baris akun non-cent (belum didukung)");
    if (skip.tidakValid) skipTxt.push(skip.tidakValid + " baris tidak valid");
    if (g.openOnly) skipTxt.push(g.openOnly + " posisi masih terbuka");
    if (!cmp.fresh.length && !cmp.diff.length && !cmp.bagian.length) {
      note("Jurnal sudah cocok dengan file: " + g.positions.length + " posisi, tidak ada yang perlu diubah." + (skipTxt.length ? " Dilewati: " + skipTxt.join(", ") + "." : ""), "ok"); return;
    }
    var lines = ["File berisi " + g.positions.length + " posisi tertutup" + (multi ? " (" + multi + " ditutup bertahap)" : "") + ".",
      "Baru: " + cmp.fresh.length + " (" + sgn(cmp.plNew) + "). Berbeda dari jurnal: " + cmp.diff.length + " (koreksi laba " + sgn(cmp.plFix) + "). Sama: " + cmp.same + "."];
    if (cmp.diff.length) lines.push("Contoh beda: " + cmp.diff.slice(0, 6).map(function (d) { return d.id + " (" + d.fields.join(", ") + ")"; }).join("; ") + (cmp.diff.length > 6 ? "; ..." : ""));
    if (skipTxt.length) lines.push("Dilewati: " + skipTxt.join(", ") + ".");
    lines.push("Saldo jurnal bila diterapkan: " + fc(r2((DATA.dashboard && DATA.dashboard.saldo || 0) + cmp.plNew + cmp.plFix)) + ". Cadangan otomatis disimpan; bisa diurungkan di sini.");
    var both = cmp.fresh.length && (cmp.diff.length || cmp.bagian.length);
    var choice = await showConfirmModal(lines.join("\n\n"), both ? { yes: "Terapkan semua", alt: "Hanya yang baru", no: "Batal" } : { yes: cmp.fresh.length ? "Tambahkan" : "Terapkan koreksi", no: "Batal" });
    if (!choice) { note(""); return; }
    var list = buildApplyList(cmp, choice === "alt");
    snapshot("Impor riwayat broker (" + file.name + ")");
    var r = mergeImportedData({ trades: list, deposit: { log: [] } });
    if (r.error) { note(r.error, "err"); return; }
    var msg = "Riwayat broker diterapkan: " + r.added + " transaksi ditambahkan, " + r.updated + " diperbarui.";
    queueNotifyAfterReload(msg, "success");
    try { sessionStorage.setItem("jurnalPendingTab", "setelan"); } catch (err) {}
    note(msg + " Memuat ulang...", "ok");
    setTimeout(function () { location.reload(); }, 400);
  });

  // Cek saldo
  var sIn = $("brokerSaldo"), sRes = $("brokerSaldoResult");
  try { var sv = localStorage.getItem(SALDO_KEY); if (sv) sIn.value = sv; } catch (e) {}
  $("brokerSaldoBtn").addEventListener("click", function () {
    var raw = sIn.value.trim(), v = num(raw);
    if (raw === "" || !isFinite(v)) { sRes.hidden = false; sRes.className = "bk-result warn"; sRes.textContent = "Isi saldo dari MT5 (dalam ¢, mis. 6271,16)."; return; }
    try { localStorage.setItem(SALDO_KEY, raw); } catch (e) {}
    var c = checkSaldo(v, DATA);
    sRes.hidden = false;
    if (Math.abs(c.diff) < 0.005) { sRes.className = "bk-result ok"; sRes.textContent = "Cocok. Saldo jurnal sama dengan broker: " + fc(c.journal) + "."; return; }
    sRes.className = "bk-result warn";
    var more = c.diff > 0
      ? "Broker lebih besar. Kemungkinan ada transaksi atau deposit yang belum tercatat, atau sebagian penutupan bertahap (partial close) belum masuk."
      : "Jurnal lebih besar. Kemungkinan ada transaksi dobel, penarikan/biaya yang belum dicatat, atau laba yang salah ketik.";
    sRes.innerHTML = "<strong>Selisih " + esc(sgn(c.diff)) + "</strong> (broker " + esc(fc(c.broker)) + ", jurnal " + esc(fc(c.journal)) + ").<br>" + esc(more) +
      "<br>Cara menemukan sebabnya: <b>Impor riwayat broker</b> di atas, lalu <b>Periksa data</b> di bawah.";
  });

  // Periksa data
  var dcRes = $("dataCheckResult");
  $("dataCheckBtn").addEventListener("click", function () {
    var all = checkDataIssues(DATA.trades), warn = all.filter(function (x) { return x.level === "warn"; }), info = all.filter(function (x) { return x.level === "info"; });
    dcRes.hidden = false;
    if (!all.length) { dcRes.className = "bk-result ok"; dcRes.textContent = "Tidak ada masalah ditemukan di " + DATA.trades.length + " transaksi."; return; }
    dcRes.className = "bk-result " + (warn.length ? "warn" : "ok");
    var show = warn.concat(info).slice(0, 40);
    dcRes.innerHTML = "<strong>" + warn.length + " perlu dicek, " + info.length + " catatan</strong> dari " + DATA.trades.length + " transaksi. Ketuk ID untuk membuka detail.<ul class=\"bk-list\">" +
      show.map(function (x) { return "<li class=\"" + x.level + "\"><button type=\"button\" class=\"bk-id\" data-id=\"" + esc(x.id) + "\">" + esc(x.id) + "</button> " + esc(x.text) + "</li>"; }).join("") + "</ul>" +
      (all.length > show.length ? "<div>... dan " + (all.length - show.length) + " lagi.</div>" : "");
  });
  dcRes.addEventListener("click", function (e) { var b = e.target.closest(".bk-id"); if (b && window.openTradeDetail) window.openTradeDetail(b.dataset.id); });

  // Urungkan impor terakhir
  function refreshUndo() {
    var s = snapshotInfo(), btn = $("undoImportBtn"), info = $("undoInfo");
    btn.disabled = !s;
    info.textContent = s ? "Cadangan sebelum \"" + s.label + "\" (" + new Date(s.ts).toLocaleString("id-ID") + ", " + s.n + " transaksi)." : "Belum ada. Cadangan dibuat otomatis sebelum impor JSON, CSV, atau riwayat broker.";
  }
  refreshUndo();
  $("undoImportBtn").addEventListener("click", async function () {
    var s = snapshotInfo(); if (!s) return;
    if (!await showConfirmModal("Kembalikan data ke kondisi sebelum \"" + s.label + "\" (" + s.n + " transaksi)? Perubahan sesudahnya, termasuk transaksi yang ditambah setelah impor, ikut hilang.", { yes: "Urungkan", no: "Batal" })) return;
    if (!restoreSnapshot()) { note("Gagal mengembalikan data.", "err"); return; }
    queueNotifyAfterReload("Impor terakhir diurungkan.", "success");
    try { sessionStorage.setItem("jurnalPendingTab", "setelan"); } catch (err) {}
    setTimeout(function () { location.reload(); }, 300);
  });
})();
