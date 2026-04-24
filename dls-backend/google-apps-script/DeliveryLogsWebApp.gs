const DEFAULT_HEADERS = [
  'Sender / Source',
  'Description / Courier',
  'Received By (Name)',
  'Date Received',
];

// Configuration for row spacing based on your sheet layouts
const COMPANY_HEADER_ROW = 2;
const COMPANY_DATA_START_ROW = 3;
const COMPANY_ID_COL = 5;

const GLOBAL_HEADER_ROW = 1;
const GLOBAL_DATA_START_ROW = 2;
const GLOBAL_ID_COL = 13;

function doPost(e) {
  try {
    const req = parseRequest(e);
    const action = req.action || 'appendDeliveryLog';

    if (action === 'validateSpreadsheetAccess') {
      return validateSpreadsheetAccess(req);
    }

    // Check if NestJS sent 'company' or 'global'
    const source = req.source === 'company' ? 'company' : 'global';

    const spreadsheetId =
      req.spreadsheetId || getScriptProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      return jsonResponse({
        status: 'error',
        message: 'spreadsheetId is required',
      });
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetTabName = req.sheetTabName || req.sheetName || 'Sheet1';
    let sheet = spreadsheet.getSheetByName(sheetTabName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetTabName);
    }

    let result;

    // STRICT ROUTING: Never cross the rules between Global and Company
    if (source === 'company') {
      ensureCompanyHeaders(sheet);
      const condensedRow = buildCondensedRow(req);
      result = upsertDeliveryRow(
        sheet,
        req,
        condensedRow,
        action,
        COMPANY_DATA_START_ROW,
        COMPANY_ID_COL,
      );
    } else {
      ensureGlobalHeaders(sheet);
      const row = buildGlobalRow(req);
      result = upsertDeliveryRow(
        sheet,
        req,
        row,
        action,
        GLOBAL_DATA_START_ROW,
        GLOBAL_ID_COL,
      );
    }

    return jsonResponse({
      status: 'success',
      mode: result.mode,
      rowIndex: result.rowIndex,
    });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

function validateSpreadsheetAccess(req) {
  try {
    const spreadsheetId =
      req.spreadsheetId || getScriptProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      return jsonResponse({
        status: 'error',
        message: 'spreadsheetId is required',
      });
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheetTabName = safeValue(req.sheetTabName || req.sheetName).trim();
    const targetSheet = sheetTabName
      ? spreadsheet.getSheetByName(sheetTabName)
      : null;

    return jsonResponse({
      status: 'success',
      spreadsheet_name: spreadsheet.getName(),
      sheet_tab_name: sheetTabName || null,
      sheet_exists: sheetTabName ? Boolean(targetSheet) : null,
    });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

function upsertDeliveryRow(sheet, req, row, action, dataStartRow, idColumn) {
  const deliveryId = req.delivery_id;
  let rowIndex = -1;

  if (action !== 'appendDeliveryLog' && deliveryId) {
    rowIndex = findExistingRowIndex(sheet, deliveryId, dataStartRow, idColumn);
  }

  if (rowIndex > 0) {
    // Update existing row
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    writeDeliveryIdCell(sheet, rowIndex, deliveryId, idColumn);
  } else {
    // Append to the next completely empty row
    rowIndex = getNextInsertRow(sheet, dataStartRow);
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    writeDeliveryIdCell(sheet, rowIndex, deliveryId, idColumn);
  }

  // Force Date Format and Hide ID Column immediately
  try {
    if (idColumn === COMPANY_ID_COL) {
      sheet.getRange(rowIndex, 4).setNumberFormat('mmm dd, yyyy'); // Force Jan 26, 2026 format
    }
    sheet.hideColumns(idColumn);
  } catch (e) {}

  return {
    mode:
      rowIndex > 0 && action !== 'appendDeliveryLog' ? 'updated' : 'appended',
    rowIndex: rowIndex,
  };
}

function getNextInsertRow(sheet, dataStartRow) {
  const lastRow = sheet.getLastRow();
  // If sheet is empty below headers, start exactly at dataStartRow
  if (lastRow < dataStartRow) return dataStartRow;

  const rowCount = lastRow - dataStartRow + 1;
  const values = sheet.getRange(dataStartRow, 1, rowCount, 1).getValues();

  // Scan downward. First row with an empty Column A is where we insert.
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === '') {
      return i + dataStartRow;
    }
  }
  return lastRow + 1;
}

function findExistingRowIndex(sheet, targetDeliveryId, dataStartRow, idColumn) {
  const lastRow = sheet.getLastRow();
  if (lastRow < dataStartRow || !targetDeliveryId) return -1;
  if (sheet.getMaxColumns() < idColumn) return -1;

  const rowCount = lastRow - dataStartRow + 1;
  const keyValues = sheet
    .getRange(dataStartRow, idColumn, rowCount, 1)
    .getValues();

  for (let i = keyValues.length - 1; i >= 0; i--) {
    if (normalizeText(keyValues[i][0]) === normalizeText(targetDeliveryId)) {
      return i + dataStartRow;
    }
  }
  return -1;
}

function buildCondensedRow(req) {
  const d = req.rowData || {};
  const del = req.delivery || {};
  const r = Array.isArray(req.row) ? req.row : [];

  // 1. Deliverer
  let deliverer = firstNonEmpty(d.deliverer, del.deliverer_name);
  if (!deliverer && r.length >= 7) deliverer = r[4];
  else if (!deliverer && r.length > 0) deliverer = r[0];

  // 2. Description & Courier
  let itemDescription = firstNonEmpty(
    d.delivery_type,
    del.delivery_type,
    d.description,
    del.description,
  );
  let courierInfo = firstNonEmpty(d.courier_supplier, del.courier_or_supplier);

  if (!itemDescription && r.length >= 7) itemDescription = r[3];
  if (!courierInfo && r.length >= 7) courierInfo = r[5];

  // Legacy fallback
  if ((!itemDescription || !courierInfo) && r.length > 0 && r.length < 7) {
    let split = String(r[1] || '').split(' / ');
    if (!itemDescription) itemDescription = split[0] || '';
    if (!courierInfo) courierInfo = split.slice(1).join(' / ') || '';
  }

  const descriptionAndCourier = [itemDescription, courierInfo]
    .filter((v) => v && String(v).trim() !== '')
    .join(' / ');

  // 3. Receiver
  let receiver = firstNonEmpty(d.receiver_name, del.recipient_name);
  if (!receiver && r.length >= 7) receiver = r[2];
  else if (!receiver && r.length > 0) receiver = r[2];

  // 4. Date
  let rawDate = firstNonEmpty(d.date_time, d.date_received, del.date_received);
  if (!rawDate && r.length >= 7) rawDate = r[0];
  else if (!rawDate && r.length > 0) rawDate = r[3];

  let formattedDate = '';
  if (rawDate) {
    const dateObj = new Date(rawDate);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = Utilities.formatDate(
        dateObj,
        Session.getScriptTimeZone(),
        'MMM dd, yyyy',
      );
    } else {
      formattedDate = safeValue(rawDate);
    }
  }

  return [
    safeValue(deliverer),
    descriptionAndCourier,
    safeValue(receiver),
    formattedDate,
  ];
}

function buildGlobalRow(req) {
  if (Array.isArray(req.row) && req.row.length > 0) {
    return req.row;
  }
  const d = req.rowData || {};
  return [
    safeValue(d.date_time),
    safeValue(d.company),
    safeValue(d.receiver_name),
    safeValue(d.delivery_type),
    safeValue(d.deliverer),
    safeValue(d.courier_supplier),
    safeValue(d.description),
    safeValue(d.received_by),
    safeValue(d.received_at),
    safeValue(d.status || 'Pending'),
    safeValue(d.signature),
    safeValue(d.reference_code),
  ];
}

function ensureCompanyHeaders(sheet) {
  const headers = [
    'Sender / Source',
    'Description / Courier',
    'Received By (Name)',
    'Date Received',
    'delivery_id',
  ];
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length - sheet.getMaxColumns(),
    );
  }
  const currentHeaders = sheet
    .getRange(COMPANY_HEADER_ROW, 1, 1, headers.length)
    .getValues()[0]
    .map(normalizeText);
  if (currentHeaders[0] !== normalizeText(headers[0])) {
    sheet
      .getRange(COMPANY_HEADER_ROW, 1, 1, headers.length)
      .setValues([headers]);
  }
  try {
    sheet.getRange(COMPANY_HEADER_ROW, COMPANY_ID_COL).setValue('delivery_id');
    sheet.hideColumns(COMPANY_ID_COL);
  } catch (e) {}
}

function ensureGlobalHeaders(sheet) {
  const headers = [
    'Date & Time',
    'Company',
    'Receiver Name',
    'Delivery Type',
    'Deliverer',
    'Courier/Supplier',
    'Description',
    'Received by',
    'Received at',
    'Status',
    'Signature',
    'Reference Code',
    'delivery_id',
  ];
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length - sheet.getMaxColumns(),
    );
  }
  const currentHeaders = sheet
    .getRange(GLOBAL_HEADER_ROW, 1, 1, headers.length)
    .getValues()[0]
    .map(normalizeText);
  if (currentHeaders[0] !== normalizeText(headers[0])) {
    sheet
      .getRange(GLOBAL_HEADER_ROW, 1, 1, headers.length)
      .setValues([headers]);
  }
  try {
    sheet.getRange(GLOBAL_HEADER_ROW, GLOBAL_ID_COL).setValue('delivery_id');
    sheet.hideColumns(GLOBAL_ID_COL);
  } catch (e) {}
}

function writeDeliveryIdCell(sheet, rowIndex, deliveryId, idColumn) {
  if (!deliveryId) return;
  sheet.getRange(rowIndex, idColumn).setValue(String(deliveryId));
}

// ---- UTILITIES ----
function parseRequest(e) {
  const params = (e && e.parameter) || {};
  const rawBody = e?.postData?.contents?.trim() || '';
  const body = rawBody ? parseJsonSafe(rawBody) || {} : {};
  const merged = Object.assign({}, parseJsonSafe(params.payload) || {}, body);

  return {
    action: merged.action || params.action,
    source: merged.source || params.source, // 'company' or 'global'
    spreadsheetId: merged.spreadsheetId || params.spreadsheetId,
    sheetTabName:
      merged.sheetTabName ||
      merged.sheetName ||
      params.sheetTabName ||
      params.sheetName,
    rowData: merged.rowData || {},
    row: merged.row || [],
    delivery_id:
      merged?.delivery?.id || merged.delivery_id || params.deliveryId,
  };
}

function safeValue(value) {
  return value == null ? '' : String(value);
}
function normalizeText(value) {
  return safeValue(value).trim().toLowerCase();
}
function firstNonEmpty(...args) {
  return args.find((v) => v != null && String(v).trim() !== '') || '';
}
function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}
function getScriptProperty(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}
function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
