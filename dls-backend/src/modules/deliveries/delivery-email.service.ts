import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';

type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
};

@Injectable()
export class DeliveryEmailService {
  private readonly logger = new Logger(DeliveryEmailService.name);
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') || 587);
    const secure = (this.configService.get<string>('MAIL_SECURE') || 'false').toLowerCase() === 'true';
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.defaultFrom = this.configService.get<string>('MAIL_FROM') || user || 'no-reply@localhost';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  private uniqueRecipients(recipients: string[]): string[] {
    return [...new Set(recipients.map((recipient) => recipient.trim()).filter(Boolean))];
  }

  private async wait(durationMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  private formatError(err: unknown): string {
    if (err instanceof Error) {
      return err.stack || err.message;
    }

    return String(err);
  }

  async sendWithRetry(payload: EmailPayload): Promise<void> {
    const recipients = this.uniqueRecipients(payload.to);
    if (!recipients.length) {
      this.logger.warn('Skipping email because no recipient addresses were provided');
      return;
    }

    const message: SendMailOptions = {
      from: payload.from || this.defaultFrom,
      to: recipients.join(', '),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    };

    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.transporter.sendMail(message);
        this.logger.log(`Email sent successfully to ${recipients.join(', ')}`);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Email attempt ${attempt} of ${maxAttempts} failed for ${recipients.join(', ')}: ${this.formatError(error)}`,
        );

        if (attempt < maxAttempts) {
          await this.wait(1000 * attempt);
        }
      }
    }

    this.logger.error(
      `Failed to send email after ${maxAttempts} attempts to ${recipients.join(', ')}: ${this.formatError(lastError)}`,
    );
    throw new Error('Failed to send delivery notification email');
  }
}