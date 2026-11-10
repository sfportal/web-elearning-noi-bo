/**
 * Máy chủ cho Phiếu tự đánh giá nhân sự (web-elearning-noi-bo).
 * Dữ liệu ghi vào chính Google Sheet chứa script này.
 *
 * Cài đặt (làm 1 lần):
 * 1. Tạo Google Sheet mới, vào Tiện ích mở rộng › Apps Script, dán toàn bộ file này, Lưu.
 * 2. Chọn hàm caiDat, bấm Chạy, cấp quyền. Mở Nhật ký thực thi để xem mã cá nhân và mã quản lý.
 * 3. Triển khai › Tùy chọn triển khai mới › Ứng dụng web: Thực thi với tư cách "Tôi", Ai có quyền truy cập "Bất kỳ ai".
 * 4. Gửi đường dẫn ứng dụng web (…/exec) cho Claude để gắn vào web.
 * Mã cá nhân gửi riêng từng người qua Zalo. Không ghi mã vào repo hay nhóm chung.
 * Cần xem lại mã: chạy hàm xemMa. Cần đổi mã một người: chạy doiMa sau khi sửa tên người trong hàm.
 */
var ROUND = '2026-11';
var STAFF = { trinh: 'Chị Trinh', tuan: 'Anh Tuấn', man: 'Chị Mẫn', ngoc: 'Chị Ngọc', huy: 'Anh Huy', minh: 'Anh Minh' };
var AREAS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'], COMMON = ['c1', 'c2', 'c3', 'c4'];
var WANT = ['no', 'maybe', 'yes'], LOAD = ['low', 'ok', 'high', 'over'], TOPICS = ['mvt', 'txng', 'tuvan', 'cd10000'];
var P = PropertiesService.getScriptProperties();

function randCode(n) { var s = '', a = 'abcdefghjkmnpqrstuvwxyz23456789'; for (var i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length)); return s; }
function caiDat() {
  var ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName('Phieu')) ss.insertSheet('Phieu').appendRow(['Đợt', 'Mã người', 'Họ tên', 'Trạng thái', 'Cập nhật', 'Gửi lúc', 'Hài lòng', 'Khối lượng', 'Muốn phụ trách chính', 'Muốn hỗ trợ', 'Dữ liệu (JSON)']);
  if (!ss.getSheetByName('NhanXet')) ss.insertSheet('NhanXet').appendRow(['Đợt', 'Mã người', 'Họ tên', 'Cập nhật', 'Dữ liệu (JSON)']);
  var codes = JSON.parse(P.getProperty('CODES') || '{}');
  Object.keys(STAFF).forEach(function (k) { if (!codes[k]) codes[k] = randCode(6); });
  P.setProperty('CODES', JSON.stringify(codes));
  if (!P.getProperty('ADMIN')) P.setProperty('ADMIN', randCode(12));
  xemMa();
}
function xemMa() {
  var codes = JSON.parse(P.getProperty('CODES') || '{}');
  Object.keys(STAFF).forEach(function (k) { Logger.log(STAFF[k] + ': ' + codes[k]); });
  Logger.log('Mã quản lý (chỉ anh Uy): ' + P.getProperty('ADMIN'));
}
function doiMa() { var who = 'minh'; var c = JSON.parse(P.getProperty('CODES') || '{}'); c[who] = randCode(6); P.setProperty('CODES', JSON.stringify(c)); Logger.log(STAFF[who] + ': ' + c[who]); }

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function str(v, n) { return typeof v === 'string' ? v.trim().slice(0, n || 1500).replace(/\d[\d .-]{7,}\d/g, '•••') : ''; }
function sc(v) { var n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : 0; }
function pick(v, max) { if (!Array.isArray(v)) return []; var r = []; v.forEach(function (x) { if (AREAS.indexOf(x) >= 0 && r.indexOf(x) < 0) r.push(x); }); return r.slice(0, max); }
function clean(b) {
  b = b || {};
  var areas = {};
  AREAS.forEach(function (a) { var x = (b.areas && b.areas[a]) || {}; areas[a] = { s: [0, 1, 2].map(function (i) { return sc(x.s && x.s[i]); }), want: WANT.indexOf(x.want) >= 0 ? x.want : '', note: str(x.note, 300) }; });
  var common = {}; COMMON.forEach(function (c) { common[c] = sc(b.common && b.common[c]); });
  var lead = pick(b.lead, 2);
  return { now: str(b.now), sat: sc(b.sat), load: LOAD.indexOf(b.load) >= 0 ? b.load : '', good: str(b.good), hard: str(b.hard), help: str(b.help),
    areas: areas, common: common, lead: lead, support: pick(b.support, 2).filter(function (x) { return lead.indexOf(x) < 0; }),
    learn: str(b.learn), topics: Array.isArray(b.topics) ? b.topics.filter(function (t) { return TOPICS.indexOf(t) >= 0; }) : [], other: str(b.other) };
}
function who(code) { var c = JSON.parse(P.getProperty('CODES') || '{}'); code = String(code || '').trim().toLowerCase(); for (var k in c) if (code && c[k] === code) return k; return ''; }
function isAdmin(k) { return !!k && String(k).trim() === P.getProperty('ADMIN'); }
function findRow(sh, pid) { var v = sh.getDataRange().getValues(); for (var i = 1; i < v.length; i++) if (v[i][0] === ROUND && v[i][1] === pid) return i + 1; return 0; }
function readJson(sh, pid, col) { var r = findRow(sh, pid); if (!r) return null; try { return JSON.parse(sh.getRange(r, col).getValue()); } catch (e) { return null; } }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var b = JSON.parse(e.postData.contents || '{}'), ss = SpreadsheetApp.getActive();
    var ph = ss.getSheetByName('Phieu'), nx = ss.getSheetByName('NhanXet');
    if (b.action === 'get' || b.action === 'save') {
      var pid = who(b.code); if (!pid) return out({ error: 'Mã không đúng' });
      if (b.action === 'get') return out({ round: ROUND, personId: pid, name: STAFF[pid], rec: readJson(ph, pid, 11) });
      lock.waitLock(10000);
      var old = readJson(ph, pid, 11), now = new Date().toISOString(), submit = b.submit === true;
      var rec = clean(b.rec); rec.personId = pid; rec.createdAt = (old && old.createdAt) || now; rec.updatedAt = now;
      rec.submittedAt = submit ? now : ((old && old.submittedAt) || ''); rec.status = rec.submittedAt ? 'sent' : 'draft';
      var row = [ROUND, pid, STAFF[pid], rec.status === 'sent' ? 'Đã gửi' : 'Nháp', now, rec.submittedAt, rec.sat || '', rec.load, rec.lead.join(', '), rec.support.join(', '), JSON.stringify(rec)];
      var r = findRow(ph, pid); if (r) ph.getRange(r, 1, 1, row.length).setValues([row]); else ph.appendRow(row);
      return out({ ok: true, rec: rec });
    }
    if (!isAdmin(b.adminKey)) return out({ error: 'Mã quản lý không đúng' });
    if (b.action === 'list') {
      var recs = {}, notes = {};
      Object.keys(STAFF).forEach(function (k) { var x = readJson(ph, k, 11); if (x) recs[k] = x; var n = readJson(nx, k, 5); if (n) notes[k] = n; });
      return out({ round: ROUND, staff: STAFF, recs: recs, notes: notes });
    }
    if (b.action === 'note') {
      var p = String(b.personId || ''); if (!STAFF[p]) return out({ error: 'Không có người này' });
      lock.waitLock(10000);
      var sco = {}; AREAS.forEach(function (a) { sco[a] = sc(b.note && b.note.sco && b.note.sco[a]); });
      var n2 = { sco: sco, text: str(b.note && b.note.text, 3000), updatedAt: new Date().toISOString() };
      var row2 = [ROUND, p, STAFF[p], n2.updatedAt, JSON.stringify(n2)], r2 = findRow(nx, p);
      if (r2) nx.getRange(r2, 1, 1, row2.length).setValues([row2]); else nx.appendRow(row2);
      return out({ ok: true, note: n2 });
    }
    return out({ error: 'bad_action' });
  } catch (err) {
    return out({ error: String(err && err.message || err) });
  } finally { try { lock.releaseLock(); } catch (e2) {} }
}
function doGet() { return out({ ok: true, app: 'phieu-tu-danh-gia', round: ROUND }); }
