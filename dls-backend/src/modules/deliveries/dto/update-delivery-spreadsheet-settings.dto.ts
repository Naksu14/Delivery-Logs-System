import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateDeliverySpreadsheetSettingsDto {
  @IsOptional()
  @IsString()
  @Matches(/^(https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+.*|[a-zA-Z0-9_-]{20,})$/, {
    message: 'global_spreadsheet must be a valid Google Sheets URL or spreadsheet ID',
  })
  global_spreadsheet?: string;

  @IsOptional()
  @IsBoolean()
  fallback_to_global?: boolean;
}