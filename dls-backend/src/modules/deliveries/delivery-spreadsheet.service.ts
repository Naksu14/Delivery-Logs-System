import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { Delivery } from './entities/delivery.entity';
import { DeliverySpreadsheetSetting } from './entities/delivery-spreadsheet-setting.entity';
import { CompanyDeliverySpreadsheet } from './entities/company-delivery-spreadsheet.entity';
import { UpdateDeliverySpreadsheetSettingsDto } from './dto/update-delivery-spreadsheet-settings.dto';
import { UpsertCompanyDeliverySpreadsheetDto } from './dto/upsert-company-delivery-spreadsheet.dto';

type SpreadsheetTarget = {
  spreadsheetId: string | null;
  source: 'company' | 'global' | 'env';
};

@Injectable()
export class DeliverySpreadsheetService {
  private readonly logger = new Logger(DeliverySpreadsheetService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DeliverySpreadsheetSetting)
    private readonly settingRepo: Repository<DeliverySpreadsheetSetting>,
    @InjectRepository(CompanyDeliverySpreadsheet)
    private readonly companySpreadsheetRepo: Repository<CompanyDeliverySpreadsheet>,
  ) {}

  private normalizeCompanyName(value?: string): string {
    return (value || '').trim().toLowerCase();
  }

  private parseSpreadsheetId(input?: string | null): string | null {
    const value = (input || '').trim();
    if (!value) {
      return null;
    }

    const linkMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (linkMatch?.[1]) {
      return linkMatch[1];
    }

    if (/^[a-zA-Z0-9_-]{20,}$/.test(value)) {
      return value;
    }

    return null;
  }

  private formatSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`;
  }

  private formatDeliveryItems(delivery: Delivery): string {
    const items = Array.isArray(delivery.delivery_items)
      ? delivery.delivery_items
          .map((item) => ({
            name: String(item?.name || '').trim(),
            quantity: Number(item?.quantity || 1),
          }))
          .filter((item) => item.name.length > 0)
      : [];

    if (!items.length) {
      return delivery.delivery_type || '';
    }

    return items.map((item) => `${item.name} (${item.quantity > 0 ? item.quantity : 1})`).join(', ');
  }

  private async getOrCreateSettings(): Promise<DeliverySpreadsheetSetting> {
    let settings = await this.settingRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingRepo.create({
        id: 1,
        fallback_to_global: true,
        global_spreadsheet_id: null,
        global_spreadsheet_url: null,
      });
      settings = await this.settingRepo.save(settings);
    }

    return settings;
  }

  private buildRow(delivery: Delivery): string[] {
    const deliveryTypeSummary = this.formatDeliveryItems(delivery);
    return [
      new Date(delivery.date_received || delivery.created_at || new Date()).toISOString(),
      delivery.company_name || '',
      delivery.recipient_name || '',
      deliveryTypeSummary,
      delivery.deliverer_name || '',
      delivery.courier_type_name || delivery.delivery_partner || '',
      delivery.description || delivery.supplier_description || '',
      delivery.received_by || '',
      delivery.received_at ? new Date(delivery.received_at).toISOString() : '',
      delivery.is_status || 'Pending',
      delivery.receiver_signature || '',
      delivery.reference_code || '',
    ];
  }

  private async getGoogleSheetsClient() {
    const serviceAccountEmail = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL') || '';
    const serviceAccountPrivateKey =
      (this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '').replace(/\\n/g, '\n');

    if (!serviceAccountEmail || !serviceAccountPrivateKey) {
      throw new Error('Google service account credentials are missing in environment variables');
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  }

  private hasServiceAccountCredentials(): boolean {
    const serviceAccountEmail = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL') || '';
    const serviceAccountPrivateKey = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '';
    return Boolean(serviceAccountEmail.trim() && serviceAccountPrivateKey.trim());
  }

  private getEnvFallbackSpreadsheetId(): string | null {
    const envId = this.parseSpreadsheetId(this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID') || '');
    if (envId) {
      return envId;
    }

    return this.parseSpreadsheetId(this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_URL') || '');
  }

  private async appendViaWebApp(
    delivery: Delivery,
    target: SpreadsheetTarget | null,
    row: string[],
    action: 'appendDeliveryLog' | 'upsertDeliveryLog',
  ): Promise<boolean> {
    const webAppUrl = (this.configService.get<string>('GOOGLE_SHEETS_WEBAPP_URL') || '').trim();
    if (!webAppUrl) {
      return false;
    }

    const spreadsheetId = target?.spreadsheetId || '';
    const source = target?.source || 'env';
    const dateTime = row[0] || '';
    const company = row[1] || '';
    const receiverName = row[2] || '';
    const deliveryType = row[3] || '';
    const totalItems = String(Number(delivery.total_items || 0) || 1);
    const deliverer = row[4] || '';
    const courierSupplier = row[5] || '';
    const description = row[6] || '';
    const receivedBy = row[7] || '';
    const receivedAt = row[8] || '';
    const status = row[9] || '';
    const signature = row[10] || '';
    const referenceCode = row[11] || '';

    const sheetTabName = (this.configService.get<string>('GOOGLE_SHEETS_TAB_NAME') || 'Sheet1').trim() || 'Sheet1';

    const payload = {
      action,
      spreadsheetId,
      source,
      sheetTabName,
      sheetName: sheetTabName,
      headers: [
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
      ],
      row,
      rowData: {
        date_time: dateTime,
        company,
        receiver_name: receiverName,
        delivery_type: deliveryType,
        total_items: totalItems,
        deliverer,
        courier_supplier: courierSupplier,
        description,
        received_by: receivedBy,
        received_at: receivedAt,
        status,
        signature,
        reference_code: referenceCode,
      },
      delivery: {
        id: delivery.id,
        reference_code: delivery.reference_code || '',
        company_name: delivery.company_name || '',
        recipient_name: delivery.recipient_name || '',
        delivery_type: delivery.delivery_type || '',
        delivery_items: Array.isArray(delivery.delivery_items) ? delivery.delivery_items : [],
        total_items: Number(delivery.total_items || 0) || 1,
        deliverer_name: delivery.deliverer_name || '',
        courier_or_supplier: delivery.courier_type_name || delivery.delivery_partner || '',
        description: delivery.description || delivery.supplier_description || '',
        received_by: delivery.received_by || '',
        received_at: delivery.received_at ? new Date(delivery.received_at).toISOString() : '',
        status: delivery.is_status || 'Pending',
        signature: delivery.receiver_signature || '',
        date_received: delivery.date_received ? new Date(delivery.date_received).toISOString() : '',
      },
    };

    const formPayload = new URLSearchParams({
      action,
      spreadsheetId,
      source,
      sheetTabName,
      sheetName: sheetTabName,
      dateTime,
      company,
      receiverName,
      deliveryType,
      deliverer,
      courierSupplier,
      description,
      receivedBy,
      receivedAt,
      status,
      signature,
      referenceCode,
      row: JSON.stringify(row),
      payload: JSON.stringify(payload),
    });

    const tryRequest = async (
      contentType: string,
      body: string,
    ): Promise<{ mode?: string; rowIndex?: number; message?: string } | null> => {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body,
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw new Error(
          `Google Sheets web app request failed with status ${response.status}: ${responseBody || 'no response body'}`,
        );
      }

      try {
        const parsed = JSON.parse(responseBody);
        if (parsed && (parsed.success === false || parsed.status === 'error')) {
          throw new Error(
            `Google Sheets web app returned error: ${parsed.message || parsed.error || responseBody}`,
          );
        }
        return {
          mode: parsed?.mode,
          rowIndex: parsed?.rowIndex,
          message: parsed?.message,
        };
      } catch {
        // Some Apps Script responses are plain text; non-JSON success bodies are acceptable.
        return null;
      }
    };

    let syncResult: { mode?: string; rowIndex?: number; message?: string } | null = null;
    try {
      // Prefer JSON because the current Apps Script endpoint expects JSON.parse(e.postData.contents).
      syncResult = await tryRequest('application/json', JSON.stringify(payload));
    } catch (jsonError) {
      this.logger.warn(
        `JSON web app append failed for delivery ${delivery.id}, retrying as form payload: ${String(jsonError)}`,
      );
      syncResult = await tryRequest('application/x-www-form-urlencoded;charset=UTF-8', formPayload.toString());
    }

    this.logger.log(
      `Delivery ${delivery.id} synced via Google Sheets web app (${source}) spreadsheet ${spreadsheetId || 'default'} tab ${sheetTabName} action ${action} mode ${syncResult?.mode || 'unknown'} row ${syncResult?.rowIndex || 'n/a'}`,
    );
    return true;
  }

  private async resolveTargetSpreadsheets(delivery: Delivery): Promise<SpreadsheetTarget[]> {
    const settings = await this.getOrCreateSettings();
    const normalizedCompanyName = this.normalizeCompanyName(delivery.company_name);
    const targets: SpreadsheetTarget[] = [];
    const addTarget = (target: SpreadsheetTarget) => {
      if (!target.spreadsheetId) {
        return;
      }
      if (targets.some((item) => item.spreadsheetId === target.spreadsheetId)) {
        return;
      }
      targets.push(target);
    };

    if ((delivery.delivery_for || '').trim() === 'Company' && normalizedCompanyName) {
      const companyMapping = await this.companySpreadsheetRepo.findOne({
        where: { company_name_key: normalizedCompanyName },
      });

      if (companyMapping?.spreadsheet_id) {
        addTarget({ spreadsheetId: companyMapping.spreadsheet_id, source: 'company' });
      }
    }

    // Always sync to global sheet when configured so all companies are centralized there.
    if (settings.global_spreadsheet_id) {
      addTarget({ spreadsheetId: settings.global_spreadsheet_id, source: 'global' });
    }

    const envSpreadsheetId = this.getEnvFallbackSpreadsheetId();
    if (targets.length === 0 && settings.fallback_to_global && envSpreadsheetId) {
      addTarget({ spreadsheetId: envSpreadsheetId, source: 'env' });
    }

    return targets;
  }

  async getSpreadsheetSettings() {
    const settings = await this.getOrCreateSettings();
    const companyMappings = await this.companySpreadsheetRepo.find({ order: { company_name: 'ASC' } });

    return {
      global_spreadsheet_url: settings.global_spreadsheet_url || null,
      global_spreadsheet_id: settings.global_spreadsheet_id || null,
      fallback_to_global: settings.fallback_to_global,
      company_mappings: companyMappings,
    };
  }

  async getCompanySpreadsheetMappings() {
    return this.companySpreadsheetRepo.find({ order: { company_name: 'ASC' } });
  }

  async updateSpreadsheetSettings(dto: UpdateDeliverySpreadsheetSettingsDto) {
    const settings = await this.getOrCreateSettings();

    if (dto.global_spreadsheet !== undefined) {
      const spreadsheetId = this.parseSpreadsheetId(dto.global_spreadsheet);
      if (!spreadsheetId) {
        throw new BadRequestException('Invalid global spreadsheet link or ID');
      }

      settings.global_spreadsheet_id = spreadsheetId;
      settings.global_spreadsheet_url = this.formatSpreadsheetUrl(spreadsheetId);
    }

    if (dto.fallback_to_global !== undefined) {
      settings.fallback_to_global = dto.fallback_to_global;
    }

    await this.settingRepo.save(settings);
    return this.getSpreadsheetSettings();
  }

  async upsertCompanySpreadsheet(dto: UpsertCompanyDeliverySpreadsheetDto) {
    const companyName = (dto.company_name || '').trim();
    const companyNameKey = this.normalizeCompanyName(companyName);
    const spreadsheetId = this.parseSpreadsheetId(dto.spreadsheet);

    if (!companyName || !companyNameKey) {
      throw new BadRequestException('company_name is required');
    }

    if (!spreadsheetId) {
      throw new BadRequestException('Invalid company spreadsheet link or ID');
    }

    let mapping = await this.companySpreadsheetRepo.findOne({ where: { company_name_key: companyNameKey } });
    if (!mapping) {
      mapping = this.companySpreadsheetRepo.create({
        company_name: companyName,
        company_name_key: companyNameKey,
      });
    }

    mapping.company_id = dto.company_id ?? null;
    mapping.company_name = companyName;
    mapping.company_name_key = companyNameKey;
    mapping.spreadsheet_id = spreadsheetId;
    mapping.spreadsheet_url = this.formatSpreadsheetUrl(spreadsheetId);

    const saved = await this.companySpreadsheetRepo.save(mapping);
    return saved;
  }

  async removeCompanySpreadsheet(id: number) {
    const mapping = await this.companySpreadsheetRepo.findOne({ where: { id } });
    if (!mapping) {
      throw new BadRequestException('Company spreadsheet mapping not found');
    }

    await this.companySpreadsheetRepo.remove(mapping);
    return { message: 'Company spreadsheet mapping removed successfully' };
  }

  async appendDeliveryLog(delivery: Delivery): Promise<void> {
    try {
      const targets = await this.resolveTargetSpreadsheets(delivery);
      const webAppUrl = (this.configService.get<string>('GOOGLE_SHEETS_WEBAPP_URL') || '').trim();

      if (targets.length === 0 && !webAppUrl) {
        this.logger.warn(
          `Skipping spreadsheet append for delivery ${delivery.id} because no configured spreadsheet target was found`,
        );
        return;
      }

      const row = this.buildRow(delivery);
      const action: 'appendDeliveryLog' | 'upsertDeliveryLog' =
        (delivery.is_status || '').trim().toLowerCase() === 'released' ? 'upsertDeliveryLog' : 'appendDeliveryLog';

      if (webAppUrl) {
        if (targets.length === 0) {
          await this.appendViaWebApp(delivery, null, row, action);
          return;
        }

        for (const target of targets) {
          await this.appendViaWebApp(delivery, target, row, action);
        }
        return;
      }

      if (this.hasServiceAccountCredentials()) {
        const sheetsClient = await this.getGoogleSheetsClient();

        for (const target of targets) {
          if (!target.spreadsheetId) {
            continue;
          }

          await sheetsClient.spreadsheets.values.append({
            spreadsheetId: target.spreadsheetId,
            range: 'A:L',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
              values: [row],
            },
          });

          this.logger.log(
            `Delivery ${delivery.id} appended to Google Sheets (${target.source}) spreadsheet ${target.spreadsheetId}`,
          );
        }
        return;
      }

      this.logger.warn(
        `Skipping spreadsheet append for delivery ${delivery.id}: neither service-account credentials nor GOOGLE_SHEETS_WEBAPP_URL is configured`,
      );
    } catch (error) {
      this.logger.error(`Failed to append delivery ${delivery.id} to Google Sheets: ${String(error)}`);
    }
  }
}