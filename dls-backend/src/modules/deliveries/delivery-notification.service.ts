import { Injectable, Logger } from '@nestjs/common';
import { Delivery } from './entities/delivery.entity';
import { CompaniesService } from '../companies/companies.service';
import { DeliveryEmailService } from './delivery-email.service';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class DeliveryNotificationService {
  private readonly logger = new Logger(DeliveryNotificationService.name);
  private readonly theme = {
    pageBackground: '#ececef',
    surface: '#ffffff',
    surfaceSoft: '#f8fafc',
    border: '#d8e0ea',
    heading: '#0f172a',
    text: '#334155',
    muted: '#64748b',
    accent: '#d4df45',
    accentStrong: '#b8c632',
    accentSoft: '#f7fadf',
    shadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
  };

  constructor(
    private readonly companiesService: CompaniesService,
    private readonly deliveryEmailService: DeliveryEmailService,
  ) {}

  private formatDate(value?: Date): string {
    if (!value) {
      return 'Not provided';
    }

    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildRecipients(company: Company): string[] {
    return [company.email_1, company.email_2].filter((email): email is string => Boolean(email?.trim()));
  }

  private buildSubject(companyName: string, referenceCode: string): string {
    return `New delivery logged for ${companyName}`;
  }

  private buildPlainText(delivery: Delivery, companyName: string): string {
    const referenceCode = delivery.reference_code || 'Not provided';
    const message = delivery.description?.trim() || 'No delivery message was provided.';
    const partner = delivery.courier_type_name || delivery.delivery_partner || 'Not provided';
    const deliveredTo = delivery.recipient_name || companyName || 'Not provided';

    return [
      `A new delivery has been logged for ${companyName}.`,
      '',
      `Company: ${companyName}`,
      `Delivered to: ${deliveredTo}`,
      `Delivery type: ${delivery.delivery_type}`,
      `Delivery partner: ${partner}`,
      `Reference code: ${referenceCode}`,
      `Received on: ${this.formatDate(delivery.date_received)}`,
      '',
      `Delivery details/message:`,
      message,
      '',
      'Use the reference_code above in the kiosk system to verify and access the delivery before marking it as received.',
    ].join('\n');
  }

  private buildHtml(delivery: Delivery, companyName: string): string {
    const referenceCode = this.escapeHtml(delivery.reference_code || 'Not provided');
    const message = this.escapeHtml(delivery.description?.trim() || 'No delivery message was provided.');
    const partner = this.escapeHtml(delivery.courier_type_name || delivery.delivery_partner || 'Not provided');
    const deliveredTo = this.escapeHtml(delivery.recipient_name || companyName || 'Not provided');
    const deliveryType = this.escapeHtml(delivery.delivery_type || 'Not provided');
    const receivedOn = this.escapeHtml(this.formatDate(delivery.date_received));
    const companyLabel = this.escapeHtml(companyName);

    return `
      <div style="margin:0;padding:0;background:${this.theme.pageBackground};font-family:Arial,Helvetica,sans-serif;color:${this.theme.text};">
        <div style="max-width:720px;margin:0 auto;padding:32px 16px;">
          <div style="background:linear-gradient(135deg,${this.theme.heading} 0%,${this.theme.accentStrong} 100%);border-radius:20px 20px 0 0;padding:28px 32px;color:#fff;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">Delivery Logs System</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">New delivery logged for ${companyLabel}</h1>
          </div>

          <div style="background:${this.theme.surface};border:1px solid ${this.theme.border};border-top:none;border-radius:0 0 20px 20px;padding:32px;box-shadow:${this.theme.shadow};">
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
              A new delivery has been recorded and is ready for verification in the kiosk system.
            </p>

            <div style="background:${this.theme.accentSoft};border:1px solid ${this.theme.border};border-radius:16px;padding:20px 22px;margin-bottom:24px;">
              <div style="font-size:13px;font-weight:700;color:${this.theme.accentStrong};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Reference code</div>
              <div style="font-size:30px;font-weight:800;letter-spacing:.18em;color:${this.theme.heading};">${referenceCode}</div>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                This reference_code must be used in the kiosk system to verify and access the delivery before it can be marked as received.
              </p>
            </div>

            <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};color:${this.theme.muted};width:180px;">Company</td>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};font-weight:700;color:${this.theme.heading};">${companyLabel}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};color:${this.theme.muted};">Delivered to</td>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};font-weight:700;color:${this.theme.heading};">${deliveredTo}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};color:${this.theme.muted};">Delivery type</td>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};font-weight:700;color:${this.theme.heading};">${deliveryType}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};color:${this.theme.muted};">Delivery partner</td>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};font-weight:700;color:${this.theme.heading};">${partner}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};color:${this.theme.muted};">Received on</td>
                <td style="padding:12px 0;border-bottom:1px solid ${this.theme.border};font-weight:700;color:${this.theme.heading};">${receivedOn}</td>
              </tr>
            </table>

            <div style="margin-bottom:12px;font-size:15px;font-weight:700;color:${this.theme.heading};">Delivery details / message</div>
            <div style="background:${this.theme.surfaceSoft};border:1px solid ${this.theme.border};border-radius:16px;padding:18px 20px;font-size:15px;line-height:1.7;color:${this.theme.text};white-space:pre-line;">${message}</div>
          </div>
        </div>
      </div>
    `;
  }

  async sendNewDeliveryNotification(delivery: Delivery): Promise<void> {
    if ((delivery.delivery_for || '').trim() !== 'Company') {
      this.logger.debug(`Skipping notification for delivery ${delivery.id} because it is not a company delivery`);
      return;
    }

    const companyName = (delivery.company_name || '').trim();
    if (!companyName) {
      this.logger.debug(`Skipping notification for delivery ${delivery.id} because no company name was provided`);
      return;
    }

    const company = await this.companiesService.findByCompanyName(companyName);
    if (!company) {
      this.logger.warn(
        `Skipping notification for delivery ${delivery.id} because no company record matched "${companyName}"`,
      );
      return;
    }

    const recipients = this.buildRecipients(company);
    if (!recipients.length) {
      this.logger.warn(
        `Skipping notification for delivery ${delivery.id} because company "${company.company_name}" has no email recipients`,
      );
      return;
    }

    const subject = this.buildSubject(company.company_name, delivery.reference_code || 'N/A');
    const html = this.buildHtml(delivery, company.company_name);
    const text = this.buildPlainText(delivery, company.company_name);

    try {
      await this.deliveryEmailService.sendWithRetry({
        to: recipients,
        subject,
        html,
        text,
      });
      this.logger.log(
        `Delivery notification sent for delivery ${delivery.id} to ${recipients.join(', ')} (${company.company_name})`,
      );
    } catch (error) {
      this.logger.error(
        `Delivery notification failed for delivery ${delivery.id} (${company.company_name}): ${String(error)}`,
      );
    }
  }
}