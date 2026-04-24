const DEFAULT_HEADERS = [
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
];

function doGet(e) {
return jsonResponse({
status: 'ok',
service: 'delivery-logs-webapp',
timestamp: new Date().toISOString(),
query: (e && e.parameter) || {},
});
}

function doPost(e) {
try {
const req = parseRequest(e);
const action = req.action || 'appendDeliveryLog';

    if (
      action !== 'appendDeliveryLog' &&
      action !== 'upsertDeliveryLog' &&
      action !== 'syncDeliveryLog'
    ) {
      return jsonResponse({
        status: 'error',
        message: 'Unsupported action: ' + action,
      });
    }

    const spreadsheetId =
      req.spreadsheetId || getScriptProperty('SPREADSHEET_ID');
    const sheetTabName =
      req.sheetTabName ||
      req.sheetName ||
      buildDefaultSheetTabName(req) ||
      getScriptProperty('SHEET_TAB_NAME') ||
      'Sheet1';

    if (!spreadsheetId) {
      return jsonResponse({
        status: 'error',
        message: 'spreadsheetId is required',
      });
    }

    if (!sheetTabName) {
      return jsonResponse({
        status: 'error',
        message: 'sheetTabName is required',
      });
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetTabName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetTabName);
    }

    const headers =
      Array.isArray(req.headers) && req.headers.length > 0
        ? req.headers
        : DEFAULT_HEADERS;
    ensureHeaders(sheet, headers);

    const row = buildRow(req);
    const upsertResult = upsertDeliveryRow(sheet, req, row, action);

    return jsonResponse({
      status: 'success',
      message:
        upsertResult.mode === 'updated'
          ? 'Delivery log updated'
          : 'Delivery log appended',
      spreadsheetId: spreadsheetId,
      sheetTabName: sheetTabName,
      rowLength: row.length,
      mode: upsertResult.mode,
      rowIndex: upsertResult.rowIndex,
    });

} catch (error) {
return jsonResponse({
status: 'error',
message: error && error.message ? error.message : String(error),
});
}
}

function upsertDeliveryRow(sheet, req, row, action) {
if (action === 'appendDeliveryLog') {
sheet.appendRow(row);
const appendedRowIndex = sheet.getLastRow();
writeDeliveryIdCell(sheet, appendedRowIndex, req.delivery_id);
return { mode: 'appended', rowIndex: appendedRowIndex };
}

const rowIndex = findExistingRowIndex(sheet, req, row);

if (rowIndex > 0) {
sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
writeDeliveryIdCell(sheet, rowIndex, req.delivery_id);
return { mode: 'updated', rowIndex: rowIndex };
}

sheet.appendRow(row);
const appendedRowIndex = sheet.getLastRow();
writeDeliveryIdCell(sheet, appendedRowIndex, req.delivery_id);
return { mode: 'appended', rowIndex: appendedRowIndex };
}

function findExistingRowIndex(sheet, req, row) {
const lastRow = sheet.getLastRow();
if (lastRow < 2) {
return -1;
}

const rowCount = lastRow - 1;
const keyValues = sheet.getRange(2, REF_CODE_COLUMN, rowCount, 2).getValues();

const targetDeliveryId = normalizeText(req && req.delivery_id);
const targetRef = normalizeText(
req && req.reference_code ? req.reference_code : row[11],
);

if (!targetDeliveryId && !targetRef) {
return -1;
}

// Reverse scan favors the most recent row in case legacy duplicates already exist.
for (var i = keyValues.length - 1; i >= 0; i -= 1) {
const currentRef = normalizeText(keyValues[i][0]);
const currentDeliveryId = normalizeText(keyValues[i][1]);

    if (
      targetDeliveryId &&
      currentDeliveryId &&
      targetDeliveryId === currentDeliveryId
    ) {
      return i + 2;
    }

    if (targetRef && currentRef && targetRef === currentRef) {
      return i + 2;
    }

}

return -1;
}

function parseRequest(e) {
const params = (e && e.parameter) || {};
const rawBody =
e && e.postData && typeof e.postData.contents === 'string'
? e.postData.contents.trim()
: '';

let body = {};
if (rawBody) {
body = parseJsonSafe(rawBody) || {};
}

const wrappedPayload = parseJsonSafe(params.payload) || {};
const merged = Object.assign({}, wrappedPayload, body);

const headers =
(Array.isArray(merged.headers) && merged.headers) ||
parseJsonSafe(params.headers) ||
DEFAULT_HEADERS;

const rowFromPayload =
(Array.isArray(merged.row) && merged.row) ||
parseJsonSafe(params.row) ||
null;

const rowData = Object.assign({}, merged.rowData || {}, {
date_time: firstNonEmpty(
merged?.rowData?.date_time,
params.dateTime,
params.date_time,
params.dateReceived,
params.date_received,
),
company: firstNonEmpty(merged?.rowData?.company, params.company),
receiver_name: firstNonEmpty(
merged?.rowData?.receiver_name,
params.receiverName,
params.receiver_name,
),
delivery_type: firstNonEmpty(
merged?.rowData?.delivery_type,
params.deliveryType,
params.delivery_type,
),
deliverer: firstNonEmpty(merged?.rowData?.deliverer, params.deliverer),
courier_supplier: firstNonEmpty(
merged?.rowData?.courier_supplier,
params.courierSupplier,
params.courier_supplier,
),
description: firstNonEmpty(
merged?.rowData?.description,
params.description,
),
received_by: firstNonEmpty(
merged?.rowData?.received_by,
params.receivedBy,
params.received_by,
),
received_at: firstNonEmpty(
merged?.rowData?.received_at,
params.receivedAt,
params.received_at,
),
status: firstNonEmpty(merged?.rowData?.status, params.status),
signature: firstNonEmpty(merged?.rowData?.signature, params.signature),
reference_code: firstNonEmpty(
merged?.rowData?.reference_code,
merged?.delivery?.reference_code,
params.referenceCode,
params.reference_code,
),
});

const delivery = merged.delivery || null;
const deliveryId = firstNonEmpty(
delivery && delivery.id,
merged?.delivery_id,
params.deliveryId,
params.delivery_id,
);

return {
action: firstNonEmpty(merged.action, params.action),
spreadsheetId: firstNonEmpty(
merged.spreadsheetId,
merged.spreadsheet_id,
params.spreadsheetId,
params.spreadsheet_id,
),
sheetTabName: firstNonEmpty(
merged.sheetTabName,
merged.sheetName,
params.sheetTabName,
params.sheetName,
),
sheetName: firstNonEmpty(
merged.sheetName,
merged.sheetTabName,
params.sheetName,
params.sheetTabName,
),
headers: headers,
row: rowFromPayload,
rowData: rowData,
delivery: delivery,
delivery_id: deliveryId,
reference_code: firstNonEmpty(rowData.reference_code),
};
}

function buildRow(req) {
if (Array.isArray(req.row) && req.row.length > 0) {
const row = req.row.slice(0, 12);
while (row.length < 12) {
row.push('');
}
return row;
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

function buildDefaultSheetTabName(req) {
const candidates = [
req && req.rowData && req.rowData.date_time,
req && req.rowData && req.rowData.received_at,
req && req.row && req.row[0],
];

for (var i = 0; i < candidates.length; i += 1) {
const value = candidates[i];
if (!value) {
continue;
}

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return 'Delivery Logs ' + year + '-' + month;
    }

}

return '';
}

function ensureHeaders(sheet, headers) {
if (sheet.getLastRow() > 0) {
ensureDeliveryIdHeader(sheet);
return;
}

sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
ensureDeliveryIdHeader(sheet);
}

function ensureDeliveryIdHeader(sheet) {
const headerCell = sheet.getRange(1, DELIVERY_ID_COLUMN);
if (!normalizeText(headerCell.getValue())) {
headerCell.setValue('delivery_id');
try {
sheet.hideColumns(DELIVERY_ID_COLUMN);
} catch (error) {
// Ignore hide failures for locked sheets; data sync still works.
}
}
}

function writeDeliveryIdCell(sheet, rowIndex, deliveryId) {
const normalizedDeliveryId = normalizeText(deliveryId);
if (!normalizedDeliveryId) {
return;
}

sheet.getRange(rowIndex, DELIVERY_ID_COLUMN).setValue(String(deliveryId));
}

function safeValue(value) {
if (value === null || value === undefined) {
return '';
}
return String(value);
}

function normalizeText(value) {
return safeValue(value).trim().toLowerCase();
}

function firstNonEmpty() {
for (var i = 0; i < arguments.length; i += 1) {
var value = arguments[i];
if (value !== null && value !== undefined && String(value).trim() !== '') {
return value;
}
}
return '';
}

function parseJsonSafe(text) {
if (!text || typeof text !== 'string') {
return null;
}

try {
return JSON.parse(text);
} catch (error) {
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




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const DEFAULT_HEADERS = [
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
];

const COMPANY_CONDENSED_HEADERS = [
  'Sender / Source',
  'Description / Courier',
  'Received By (Name)',
  'Date Received',
];

const REF_CODE_COLUMN = 12;
const DELIVERY_ID_COLUMN = 13;
const COMPANY_DELIVERY_ID_COL = 5; // Column E

function doPost(e) {
  try {
    const req = parseRequest(e);
    const action = req.action || 'appendDeliveryLog';

    // 1. LOG TO GLOBAL SPREADSHEET
    const spreadsheetId =
      req.spreadsheetId || getScriptProperty('SPREADSHEET_ID');
    const sheetTabName = req.sheetTabName || 'Sheet1';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetTabName);
    if (!sheet) sheet = spreadsheet.insertSheet(sheetTabName);

    ensureHeaders(sheet, DEFAULT_HEADERS);
    const row = buildRow(req);
    const globalResult = upsertDeliveryRow(sheet, req, row, action);

    // 2. LOG TO COMPANY SPREADSHEET (INTERNAL DUAL-LOGGING)
    const companyResult = logToCompanySpreadsheet(req, action);

    return jsonResponse({
      status: 'success',
      global: globalResult,
      company: companyResult,
    });
  } catch (error) {
    return jsonResponse({ status: 'error', message: String(error) });
  }
}

function logToCompanySpreadsheet(req, action) {
  const company = safeValue(req.rowData?.company);
  if (!company) return { status: 'skipped', message: 'No company found' };

  const companySpreadsheetId = getCompanySpreadsheetId(company);
  if (!companySpreadsheetId)
    return { status: 'skipped', message: 'No ID mapping found' };

  const spreadsheet = SpreadsheetApp.openById(companySpreadsheetId);
  const sheetName = buildCompanySheetTabName(req) || 'Deliveries';
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

  ensureCondensedHeaders(sheet);
  const condensedRow = buildCondensedRow(req);

  return upsertCompanyDeliveryRow(sheet, req, condensedRow, action);
}

function buildCondensedRow(req) {
  const d = req.rowData || {};

  // Combine Description and Courier/Supplier
  const descriptionAndCourier = [
    safeValue(d.description),
    safeValue(d.courier_supplier),
  ]
    .filter((v) => v.trim() !== '')
    .join(' / ');

  // Format Date to mm/dd/yyyy
  let formattedDate = '';
  if (d.date_time) {
    const dateObj = new Date(d.date_time);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = Utilities.formatDate(
        dateObj,
        Session.getScriptTimeZone(),
        'MM/dd/yyyy',
      );
    }
  }

  return [
    safeValue(d.deliverer), // 'Sender / Source'
    descriptionAndCourier, // 'Description / Courier'
    safeValue(d.receiver_name), // 'Received By (Name)'
    formattedDate, // 'Date Received'
  ];
}

function upsertCompanyDeliveryRow(sheet, req, row, action) {
  const deliveryId = req.delivery_id;
  let rowIndex = -1;

  if (action !== 'appendDeliveryLog' && deliveryId) {
    const data = sheet
      .getRange(1, COMPANY_DELIVERY_ID_COL, sheet.getLastRow(), 1)
      .getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (normalizeText(data[i][0]) === normalizeText(deliveryId)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { mode: 'updated', rowIndex: rowIndex };
  } else {
    sheet.appendRow(row);
    const newRow = sheet.getLastRow();
    if (deliveryId)
      sheet.getRange(newRow, COMPANY_DELIVERY_ID_COL).setValue(deliveryId);
    return { mode: 'appended', rowIndex: newRow };
  }
}

function ensureCondensedHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [...COMPANY_CONDENSED_HEADERS, 'delivery_id'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.hideColumns(COMPANY_DELIVERY_ID_COL);
  }
}

function ensureCompanyDeliveryIdHeader(sheet) {
  const deliveryIdColumn = 5; // Column E
  const headerCell = sheet.getRange(1, deliveryIdColumn);
  if (!normalizeText(headerCell.getValue())) {
    headerCell.setValue('delivery_id');
    try {
      sheet.hideColumns(deliveryIdColumn);
    } catch (error) {
      // Ignore hide failures for locked sheets
    }
  }
}

function writeCompanyDeliveryIdCell(sheet, rowIndex, deliveryId) {
  const normalizedDeliveryId = normalizeText(deliveryId);
  if (!normalizedDeliveryId) {
    return;
  }

  sheet.getRange(rowIndex, 5).setValue(String(deliveryId));
}

function buildCompanySheetTabName(req) {
  const candidates = [
    req && req.rowData && req.rowData.date_time,
    req && req.rowData && req.rowData.received_at,
  ];

  for (var i = 0; i < candidates.length; i += 1) {
    const value = candidates[i];
    if (!value) {
      continue;
    }

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return 'Deliveries ' + year + '-' + month;
    }
  }

  return '';
}

function getCompanySpreadsheetId(company) {
  try {
    const companyMappingsJson = getScriptProperty('COMPANY_SPREADSHEETS');
    if (!companyMappingsJson) {
      return null;
    }

    const mappings = parseJsonSafe(companyMappingsJson);
    if (!mappings || typeof mappings !== 'object') {
      return null;
    }

    // Normalize company name for lookup
    const normalizedCompany = normalizeText(company);
    for (var key in mappings) {
      if (
        mappings.hasOwnProperty(key) &&
        normalizeText(key) === normalizedCompany
      ) {
        return mappings[key];
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

function findExistingRowIndex(sheet, req, row) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  const rowCount = lastRow - 1;
  const keyValues = sheet.getRange(2, REF_CODE_COLUMN, rowCount, 2).getValues();

  const targetDeliveryId = normalizeText(req && req.delivery_id);
  const targetRef = normalizeText(
    req && req.reference_code ? req.reference_code : row[11],
  );

  if (!targetDeliveryId && !targetRef) {
    return -1;
  }

  // Reverse scan favors the most recent row in case legacy duplicates already exist.
  for (var i = keyValues.length - 1; i >= 0; i -= 1) {
    const currentRef = normalizeText(keyValues[i][0]);
    const currentDeliveryId = normalizeText(keyValues[i][1]);

    if (
      targetDeliveryId &&
      currentDeliveryId &&
      targetDeliveryId === currentDeliveryId
    ) {
      return i + 2;
    }

    if (targetRef && currentRef && targetRef === currentRef) {
      return i + 2;
    }
  }

  return -1;
}

function parseRequest(e) {
  const params = (e && e.parameter) || {};
  const rawBody =
    e && e.postData && typeof e.postData.contents === 'string'
      ? e.postData.contents.trim()
      : '';

  let body = {};
  if (rawBody) {
    body = parseJsonSafe(rawBody) || {};
  }

  const wrappedPayload = parseJsonSafe(params.payload) || {};
  const merged = Object.assign({}, wrappedPayload, body);

  const headers =
    (Array.isArray(merged.headers) && merged.headers) ||
    parseJsonSafe(params.headers) ||
    DEFAULT_HEADERS;

  const rowFromPayload =
    (Array.isArray(merged.row) && merged.row) ||
    parseJsonSafe(params.row) ||
    null;

  const rowData = Object.assign({}, merged.rowData || {}, {
    date_time: firstNonEmpty(
      merged?.rowData?.date_time,
      params.dateTime,
      params.date_time,
      params.dateReceived,
      params.date_received,
    ),
    company: firstNonEmpty(merged?.rowData?.company, params.company),
    receiver_name: firstNonEmpty(
      merged?.rowData?.receiver_name,
      params.receiverName,
      params.receiver_name,
    ),
    delivery_type: firstNonEmpty(
      merged?.rowData?.delivery_type,
      params.deliveryType,
      params.delivery_type,
    ),
    deliverer: firstNonEmpty(merged?.rowData?.deliverer, params.deliverer),
    courier_supplier: firstNonEmpty(
      merged?.rowData?.courier_supplier,
      params.courierSupplier,
      params.courier_supplier,
    ),
    description: firstNonEmpty(
      merged?.rowData?.description,
      params.description,
    ),
    received_by: firstNonEmpty(
      merged?.rowData?.received_by,
      params.receivedBy,
      params.received_by,
    ),
    received_at: firstNonEmpty(
      merged?.rowData?.received_at,
      params.receivedAt,
      params.received_at,
    ),
    status: firstNonEmpty(merged?.rowData?.status, params.status),
    signature: firstNonEmpty(merged?.rowData?.signature, params.signature),
    reference_code: firstNonEmpty(
      merged?.rowData?.reference_code,
      merged?.delivery?.reference_code,
      params.referenceCode,
      params.reference_code,
    ),
  });

  const delivery = merged.delivery || null;
  const deliveryId = firstNonEmpty(
    delivery && delivery.id,
    merged?.delivery_id,
    params.deliveryId,
    params.delivery_id,
  );

  return {
    action: firstNonEmpty(merged.action, params.action),
    spreadsheetId: firstNonEmpty(
      merged.spreadsheetId,
      merged.spreadsheet_id,
      params.spreadsheetId,
      params.spreadsheet_id,
    ),
    sheetTabName: firstNonEmpty(
      merged.sheetTabName,
      merged.sheetName,
      params.sheetTabName,
      params.sheetName,
    ),
    sheetName: firstNonEmpty(
      merged.sheetName,
      merged.sheetTabName,
      params.sheetName,
      params.sheetTabName,
    ),
    headers: headers,
    row: rowFromPayload,
    rowData: rowData,
    delivery: delivery,
    delivery_id: deliveryId,
    reference_code: firstNonEmpty(rowData.reference_code),
  };
}

function buildRow(req) {
  if (Array.isArray(req.row) && req.row.length > 0) {
    const row = req.row.slice(0, 12);
    while (row.length < 12) {
      row.push('');
    }
    return row;
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

function buildDefaultSheetTabName(req) {
  const candidates = [
    req && req.rowData && req.rowData.date_time,
    req && req.rowData && req.rowData.received_at,
    req && req.row && req.row[0],
  ];

  for (var i = 0; i < candidates.length; i += 1) {
    const value = candidates[i];
    if (!value) {
      continue;
    }

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return 'Delivery Logs ' + year + '-' + month;
    }
  }

  return '';
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() > 0) {
    ensureDeliveryIdHeader(sheet);
    return;
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  ensureDeliveryIdHeader(sheet);
}

function ensureDeliveryIdHeader(sheet) {
  const headerCell = sheet.getRange(1, DELIVERY_ID_COLUMN);
  if (!normalizeText(headerCell.getValue())) {
    headerCell.setValue('delivery_id');
    try {
      sheet.hideColumns(DELIVERY_ID_COLUMN);
    } catch (error) {
      // Ignore hide failures for locked sheets; data sync still works.
    }
  }
}

function writeDeliveryIdCell(sheet, rowIndex, deliveryId) {
  const normalizedDeliveryId = normalizeText(deliveryId);
  if (!normalizedDeliveryId) {
    return;
  }

  sheet.getRange(rowIndex, DELIVERY_ID_COLUMN).setValue(String(deliveryId));
}

function safeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function normalizeText(value) {
  return safeValue(value).trim().toLowerCase();
}

function firstNonEmpty() {
  for (var i = 0; i < arguments.length; i += 1) {
    var value = arguments[i];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function parseJsonSafe(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
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
