/**
 * Blitzbirne Rangliste
 * Speichert Zeiten der Rechenblöcke in dieser Google Tabelle und liefert die Bestenliste.
 * Einrichten: Erweiterungen > Apps Script, diesen Code einfügen, speichern,
 * Bereitstellen > Neue Bereitstellung > Web-App, Ausführen als: Ich, Zugriff: Jeder.
 */
const SHEET = 'Ergebnisse';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['Zeitpunkt', 'Name', 'Spieler', 'Tafel', 'Block', 'Millisekunden', 'Fehler', 'Aufgaben']);
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const name = String(d.name || '').trim().slice(0, 20);
    const uid = String(d.uid || '').slice(0, 40);
    const board = String(d.board || '').slice(0, 20);
    const block = String(d.block || '').slice(0, 3);
    const ms = Math.round(Number(d.ms));
    const err = Math.max(0, Math.round(Number(d.err) || 0));
    const n = Math.max(0, Math.round(Number(d.n) || 0));
    const okBlock = /^[A-J]$/.test(block) || block === 'ALL';
    if (!name || !uid || !/^[a-z0-9]+$/i.test(board) || !okBlock || !(ms >= 5000 && ms < 4 * 3600 * 1000)) {
      return json_({ok: false, error: 'ungültig'});
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_().appendRow([new Date(), name, uid, board, block, ms, err, n]);
    } finally {
      lock.releaseLock();
    }
    return json_({ok: true, top: top_(board)});
  } catch (x) {
    return json_({ok: false, error: String(x)});
  }
}

function doGet(e) {
  const board = String((e && e.parameter && e.parameter.board) || 'e2block');
  return json_({ok: true, top: top_(board)});
}

// Pro Block die beste Zeit jedes Spielers, schnellste zuerst
function top_(board) {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const best = {};
  rows.forEach(function (r) {
    if (String(r[3]) !== board) return;
    const b = String(r[4]), u = String(r[2]), ms = Number(r[5]);
    if (!best[b]) best[b] = {};
    const cur = best[b][u];
    if (!cur || ms < cur.ms) best[b][u] = {name: String(r[1]), ms: ms, err: Number(r[6]) || 0, n: Number(r[7]) || 0, uid: u};
  });
  const out = {};
  Object.keys(best).forEach(function (b) {
    out[b] = Object.keys(best[b]).map(function (u) { return best[b][u]; }).sort(function (x, y) { return x.ms - y.ms; }).slice(0, 30);
  });
  return out;
}
