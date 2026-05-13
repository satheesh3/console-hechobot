import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

// Minimal typings for the parts of the YCloud API we touch. Keep this thin —
// shapes evolve and are documented at https://docs.ycloud.com/.
export interface YcloudSendMessageRequest {
  from: string; // E.164 sender phone number registered with YCloud
  to: string;
  type: 'text' | 'template' | 'image' | 'document' | 'audio' | 'video' | 'interactive';
  text?: { body: string; previewUrl?: boolean };
  template?: {
    name: string;
    language: { code: string };
    components?: unknown[];
  };
  [key: string]: unknown;
}

export interface YcloudTemplatePayload {
  wabaId: string;
  name: string;
  category: string;
  language: string;
  components: unknown[];
}

@Injectable()
export class YcloudService {
  private readonly logger = new Logger(YcloudService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async sendMessage(payload: YcloudSendMessageRequest): Promise<Record<string, unknown>> {
    return this.request('POST', '/whatsapp/messages', payload);
  }

  async createTemplate(payload: YcloudTemplatePayload): Promise<Record<string, unknown>> {
    return this.request('POST', '/whatsapp/templates', payload);
  }

  async listTemplates(wabaId: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/whatsapp/templates?wabaId=${encodeURIComponent(wabaId)}`);
  }

  async deleteTemplate(wabaId: string, name: string): Promise<Record<string, unknown>> {
    return this.request(
      'DELETE',
      `/whatsapp/templates?wabaId=${encodeURIComponent(wabaId)}&name=${encodeURIComponent(name)}`,
    );
  }

  // TODO: wire to the real YCloud Embedded Signup channel-provisioning endpoint
  // once we have BSP credentials. Today this is a placeholder.
  async registerChannel(input: {
    wabaId: string;
    phoneNumberId: string;
    displayPhoneNumber: string;
  }): Promise<Record<string, unknown>> {
    this.logger.warn(
      `registerChannel called as stub for waba=${input.wabaId} phone=${input.displayPhoneNumber}. ` +
        'TODO: replace with real YCloud partner provisioning call.',
    );
    return { ok: true, stub: true, ...input };
  }

  // YCloud signs webhook deliveries; verify before trusting the payload.
  // Assumed scheme: HMAC-SHA256(secret, rawBody) compared against a header
  // (e.g. x-ycloud-signature). Adjust once we confirm the real header name in
  // the YCloud docs.
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string | undefined): boolean {
    const secret = this.config.get<string>('ycloud.webhookSecret');
    if (!secret) {
      this.logger.warn('YCLOUD_WEBHOOK_SECRET is not set — accepting unsigned webhook.');
      return true;
    }
    if (!signatureHeader) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signatureHeader.replace(/^sha256=/, '').trim();
    if (expected.length !== provided.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }

  private async request<T = Record<string, unknown>>(
    method: AxiosRequestConfig['method'],
    url: string,
    data?: unknown,
  ): Promise<T> {
    try {
      const res = await firstValueFrom(
        this.http.request<T>({ method, url, data }),
      );
      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; error?: unknown }>;
      const status = axiosErr.response?.status ?? 502;
      const body = axiosErr.response?.data ?? { message: axiosErr.message };
      this.logger.error(`YCloud ${method} ${url} failed (${status}): ${JSON.stringify(body)}`);
      throw new BadGatewayException({ upstreamStatus: status, upstreamBody: body });
    }
  }
}
