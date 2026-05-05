/**
 * AppGastos - Backend (Google Apps Script)
 * Publish as Web App: Execute as ME, Access: ANYONE
 */

const SPREADSHEET_ID = 'TU_SPREADSHEET_ID'; // REEMPLAZAR CON TU ID

function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse({ 
      status: 'error', 
      message: 'No se recibieron parámetros. Este script debe ejecutarse como Web App.' 
    });
  }
  
  const action = (e.parameter.action || '').trim().toLowerCase();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    if (action === 'getall') {
      return jsonResponse({
        status: 'success',
        data: {
          periodos: getSheetData(ss, 'Periodos'),
          cuentas: getSheetData(ss, 'Cuentas'),
          tiposIngreso: getSheetData(ss, 'TiposIngreso'),
          formasPago: getSheetData(ss, 'FormasPago'),
          categorias: getSheetData(ss, 'Categorias'),
          gastos: getSheetData(ss, 'Gastos'),
          ingresos: getSheetData(ss, 'Ingresos'),
          transferencias: getSheetData(ss, 'Transferencias')
        }
      });
    }
    
    // Fallback
    return jsonResponse({ status: 'error', message: 'Acción no válida' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    let sheetName = '';
    let data = {};
    
    switch(action) {
      case 'addGasto':
        sheetName = 'Gastos';
        data = postData;
        break;
      case 'addIngreso':
        sheetName = 'Ingresos';
        data = postData;
        break;
      case 'addTransferencia':
        sheetName = 'Transferencias';
        data = postData;
        break;
      case 'addCuenta':
        sheetName = 'Cuentas';
        data = postData;
        break;
      case 'addPeriodo':
        sheetName = 'Periodos';
        data = postData;
        break;
    }
    
    if (sheetName) {
      appendDataToSheet(ss, sheetName, data);
      return jsonResponse({ status: 'success', message: 'Datos guardados' });
    }
    
    return jsonResponse({ status: 'error', message: 'Acción POST no válida' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- Helpers ---

function getSheetData(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return []; // Solo encabezados o vacío
  
  const headers = values.shift().map(h => h.toString().trim().toLowerCase());
  
  return values
    .filter(row => row.some(cell => cell !== '')) // Ignorar filas vacías
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i];
      });
      return obj;
    });
}

function appendDataToSheet(ss, name, data) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => h.toString().trim().toLowerCase());
    
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  
  sheet.appendRow(row);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Función para inicializar la hoja con todas las pestañas y encabezados necesarios
 */
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = {
    'Periodos': ['id', 'año', 'estado'],
    'Cuentas': ['id', 'nombre', 'moneda', 'saldoInicial', 'activa'],
    'TiposIngreso': ['id', 'nombre'],
    'FormasPago': ['id', 'nombre'],
    'Categorias': ['id', 'nombre', 'icono'],
    'Gastos': ['id', 'fecha', 'importe', 'cuentaOrigen', 'categoria', 'formaPago', 'esServicio', 'descripcion', 'periodo'],
    'Ingresos': ['id', 'fecha', 'importe', 'cuentaDestino', 'tipoIngreso', 'periodo'],
    'Transferencias': ['id', 'fecha', 'importe', 'cuentaOrigen', 'cuentaDestino', 'tipoCambio', 'descripcion']
  };
  
  for (let name in sheets) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, sheets[name].length).setValues([sheets[name]]);
    }
  }
}
