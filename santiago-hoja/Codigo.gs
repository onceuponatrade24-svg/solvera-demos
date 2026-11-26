/**
 * Tablero de clientes de Santiago — conexión con esta hoja.
 * Se pega en: Extensiones > Apps Script (dentro de la hoja "VENTAS EDGAR").
 *
 * Qué hace:
 *  - Lee (sin modificar) las pestañas VENTAS EDGAR KT, VENTAS EDGAR WE y PENDIENTES.
 *  - Cuando Santiago anota un seguimiento, lo agrega en una pestaña NUEVA
 *    llamada "SEGUIMIENTO SANTIAGO" (la crea sola la primera vez).
 *  - Solo responde a quien traiga la clave secreta de abajo.
 */

// Clave secreta: debe ser IGUAL a la variable SANTIAGO_HOJA_TOKEN en Vercel.
const TOKEN = 'PEGA_AQUI_LA_CLAVE';

const PESTANAS = ['VENTAS EDGAR KT', 'VENTAS EDGAR WE', 'PENDIENTES'];
const SEGUIMIENTO = 'SEGUIMIENTO SANTIAGO';

function doGet(e) {
  if (!e || !e.parameter || e.parameter.token !== TOKEN) return responder({ ok: false, error: 'Sin permiso.' });
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = {};
  PESTANAS.concat([SEGUIMIENTO]).forEach(function (nombre) {
    const hoja = libro.getSheetByName(nombre);
    hojas[nombre] = hoja ? hoja.getDataRange().getDisplayValues() : [];
  });
  return responder({ ok: true, hojas: hojas, actualizado: new Date().toISOString() });
}

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'Datos inválidos.' });
  }
  if (d.token !== TOKEN) return responder({ ok: false, error: 'Sin permiso.' });

  const candado = LockService.getScriptLock();
  candado.waitLock(10000);
  try {
    const libro = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = libro.getSheetByName(SEGUIMIENTO);
    if (!hoja) {
      hoja = libro.insertSheet(SEGUIMIENTO);
      hoja.getRange('A:G').setNumberFormat('@'); // todo como texto, para que las fechas no se muevan
      hoja.appendRow(['Fecha', 'Cliente', 'Celular', 'Resultado', 'Nota', 'Próximo contacto', 'Registró']);
      hoja.setFrozenRows(1);
    }
    const ahora = Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd HH:mm');
    hoja.appendRow([
      ahora,
      String(d.cliente || '').slice(0, 120),
      String(d.celular || '').slice(0, 40),
      String(d.resultado || '').slice(0, 60),
      String(d.nota || '').slice(0, 1000),
      String(d.proximo || '').slice(0, 10),
      'Santiago',
    ]);
  } finally {
    candado.releaseLock();
  }
  return responder({ ok: true });
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
