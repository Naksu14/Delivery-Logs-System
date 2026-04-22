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
