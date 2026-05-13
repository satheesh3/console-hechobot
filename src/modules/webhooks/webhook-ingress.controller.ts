import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { YcloudService } from '../ycloud/ycloud.service';
import { WebhookIngressService } from './webhook-ingress.service';

@Controller('webhooks/ycloud')
export class WebhookIngressController {
  constructor(
    private readonly ingress: WebhookIngressService,
    private readonly ycloud: YcloudService,
  ) {}

  @Post()
  @HttpCode(200)
  async receive(
    @Req() req: Request,
    @Headers('x-ycloud-signature') signature: string | undefined,
    @Body() _parsed: unknown,
  ) {
    // The raw body parser registered in main.ts gives us a Buffer here.
    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequestException('Expected raw body for webhook');
    }

    if (!this.ycloud.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid JSON');
    }

    // YCloud may send an array of events or a single event. Normalise.
    const events = Array.isArray(payload) ? payload : [payload];
    for (const evt of events) {
      // eslint-disable-next-line no-await-in-loop
      await this.ingress.ingest(evt as Record<string, unknown>);
    }
    return { received: events.length };
  }
}
