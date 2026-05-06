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
      // CRUD para Tipos de Ingreso
      case 'addTipoIngreso':
        sheetName = 'TiposIngreso';
        data = postData;
        break;
      case 'updateTipoIngreso':
        updateDataInSheet(ss, 'TiposIngreso', postData);
        return jsonResponse({ status: 'success', message: 'Tipo de ingreso actualizado' });
      case 'deleteTipoIngreso':
        deleteDataFromSheet(ss, 'TiposIngreso', postData.id);
        return jsonResponse({ status: 'success', message: 'Tipo de ingreso eliminado' });
      // CRUD para Categorías
      case 'addCategoria':
        sheetName = 'Categorias';
        data = postData;
        break;
      case 'updateCategoria':
        updateDataInSheet(ss, 'Categorias', postData);
        return jsonResponse({ status: 'success', message: 'Categoría actualizada' });
      case 'deleteCategoria':
        deleteDataFromSheet(ss, 'Categorias', postData.id);
        return jsonResponse({ status: 'success', message: 'Categoría eliminada' });
      // CRUD para Formas de Pago
      case 'addFormaPago':
        sheetName = 'FormasPago';
        data = postData;
        break;
      case 'updateFormaPago':
        updateDataInSheet(ss, 'FormasPago', postData);
        return jsonResponse({ status: 'success', message: 'Forma de pago actualizada' });
      case 'deleteFormaPago':
        deleteDataFromSheet(ss, 'FormasPago', postData.id);
        return jsonResponse({ status: 'success', message: 'Forma de pago eliminada' });
    }
    
    if (sheetName) {
      appendDataToSheet(ss, sheetName, data);
      return jsonResponse({ status: 'success', message: 'Datos guardados' });
    }
    
    return jsonResponse({ status: 'error', message: 'Acción POST no válida' });
  } catch (err) {
    console.error('Error en doPost:', err.toString());
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- Helpers ---

function getSheetData(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; 
  
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(h => h.toString().trim().toLowerCase());
  
  return values
    .filter(row => row.some(cell => cell !== '')) 
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
  
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) throw new Error('La hoja ' + name + ' no tiene encabezados.');
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(h => h.toString().trim().toLowerCase());
    
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  
  sheet.appendRow(row);
}

function updateDataInSheet(ss, name, data) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name);
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0].map(h => h.toString().trim().toLowerCase());
  const idIndex = headers.indexOf('id');
  
  if (idIndex === -1) throw new Error('Columna ID no encontrada');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex].toString() === data.id.toString()) {
      const rowData = headers.map(h => data[h] !== undefined ? data[h] : values[i][headers.indexOf(h)]);
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  throw new Error('ID no encontrado para actualización');
}

function deleteDataFromSheet(ss, name, id) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name);
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0].map(h => h.toString().trim().toLowerCase());
  const idIndex = headers.indexOf('id');
  
  if (idIndex === -1) throw new Error('Columna ID no encontrada');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIndex].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('ID no encontrado para eliminación');
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
