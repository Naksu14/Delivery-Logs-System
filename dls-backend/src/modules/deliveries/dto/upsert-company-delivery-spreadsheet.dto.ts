import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpsertCompanyDeliverySpreadsheetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  company_id?: number;

  @IsString()
  company_name!: string;

  @IsString()
  @Matches(/^(https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+.*|[a-zA-Z0-9_-]{20,})$/, {
    message: 'spreadsheet must be a valid Google Sheets URL or spreadsheet ID',
  })
  spreadsheet!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sheet_tab_name?: string;
}