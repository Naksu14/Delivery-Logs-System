# Delivery Logs Apps Script Web App

This script exposes a web app endpoint for appending delivery rows to Google Sheets.

## File

- DeliveryLogsWebApp.gs

## Input Formats Supported

- JSON body (preferred)
- Form URL encoded fields

## Required Payload

- action: upsertDeliveryLog (appendDeliveryLog and syncDeliveryLog are also accepted)
- spreadsheetId: Google Spreadsheet ID
- sheetTabName or sheetName: target tab name (optional; script auto-builds a monthly tab when not provided)
- row: 11-item array (optional if rowData fields are provided)

## Deploy Steps

1. Open https://script.google.com and create a new Apps Script project.
2. Paste all content from DeliveryLogsWebApp.gs into Code.gs.
3. Save the project.
4. Deploy > New deployment.
5. Select type: Web app.
6. Execute as: Me.
7. Who has access: Anyone.
8. Deploy and copy the Web app URL.

Script Properties are optional fallback only (not required for normal backend flow):

- SPREADSHEET_ID = default spreadsheet id
- SHEET_TAB_NAME = default tab name

## Backend .env Values

Set these values in dls-backend/.env:

- GOOGLE_SHEETS_WEBAPP_URL=<your web app url>
- GOOGLE_SHEETS_TAB_NAME=Sheet1

Optional fallback if no DB mapping is configured:

- GOOGLE_SHEETS_SPREADSHEET_ID=<your spreadsheet id>

System-driven behavior:

- Spreadsheet ID is selected by backend settings (company mapping first, then global, then env fallback).
- Sheet tab is taken from backend payload; if missing, Apps Script creates a monthly tab like Delivery Logs 2026-04.
- When a package is verified/released, the same row is updated with received_by, received_at, status, and signature when a match is found; otherwise a new row is appended.
- Company deliveries sync to both spreadsheets when both are configured:
  - company-specific spreadsheet
  - global spreadsheet

## Quick Test

Send a POST request with JSON:
{
"action": "appendDeliveryLog",
"spreadsheetId": "<spreadsheet-id>",
"sheetTabName": "Sheet1",
"row": [
"2026-04-10T12:00:00.000Z",
"Sample Company",
"Receiver",
"Document",
"Courier Name",
"Lalamove",
"Test append",
"Admin",
"2026-04-10T12:00:00.000Z",
"Pending",
"signature"
]
}

Expected response:
{
"status": "success",
"message": "Delivery log appended"
}
