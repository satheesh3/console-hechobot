import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import * as crypto from 'crypto';
import { Op } from 'sequelize';
import { firstValueFrom } from 'rxjs';
import { WebhookDelivery } from './webhook-delivery.model';
import { WebhookEvent } from './webhook-event.model';
import { WebhookSubscription } from './webhook-subscription.model';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    @InjectModel(WebhookDelivery) private readonly deliveries: typeof WebhookDelivery,
    @InjectModel(WebhookSubscription) private readonly subs: typeof WebhookSubscription,
    @InjectModel(WebhookEvent) private readonly events: typeof WebhookEvent,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async enqueueFanout(
    event: WebhookEvent,
    subscriptions: WebhookSubscription[],
  ): Promise<void> {
    const now = new Date();
    const rows = subscriptions.map((s) => ({
      subscriptionId: s.id,
      eventId: event.id,
      status: 'pending' as const,
      attemptCount: 0,
      nextAttemptAt: now,
    }));
    if (rows.length === 0) return;
    await this.deliveries.bulkCreate(rows as WebhookDelivery[]);
    // Fire-and-forget: don't block ingest on outbound HTTP.
    setImmediate(() => this.drain().catch((e) => this.logger.error(e)));
  }

  // Runs every 30s as a safety net for retries. The fast path is the
  // setImmediate from enqueueFanout above.
  @Cron(CronExpression.EVERY_30_SECONDS)
  async drain(): Promise<void> {
    const maxAttempts = this.config.get<number>('webhookDelivery.maxAttempts', 8);
    const timeout = this.config.get<number>('webhookDelivery.timeoutMs', 10_000);

    const due = await this.deliveries.findAll({
      where: {
        status: { [Op.in]: ['pending'] },
        nextAttemptAt: { [Op.lte]: new Date() },
      },
      limit: 50,
      include: [WebhookEvent, WebhookSubscription],
    });

    await Promise.all(due.map((d) => this.attempt(d, maxAttempts, timeout)));
  }

  private async attempt(
    delivery: WebhookDelivery,
    maxAttempts: number,
    timeoutMs: number,
  ): Promise<void> {
    await delivery.update({ status: 'in_flight', attemptCount: delivery.attemptCount + 1 });
    const subscription =
      delivery.subscription ?? (await this.subs.findByPk(delivery.subscriptionId));
    const event = delivery.event ?? (await this.events.findByPk(delivery.eventId));
    if (!subscription || !event || !subscription.active) {
      await delivery.update({
        status: 'failed',
        lastError: 'subscription missing or inactive',
      });
      return;
    }

    const body = JSON.stringify({
      id: event.id,
      type: event.type,
      createdAt: event.createdAt,
      data: event.payload,
    });
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', subscription.signingSecret)
      .update(`${ts}.${body}`)
      .digest('hex');

    try {
      const res = await firstValueFrom(
        this.http.request({
          method: 'POST',
          url: subscription.url,
          data: body,
          timeout: timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Timestamp': ts,
            'X-Webhook-Signature': `t=${ts},v1=${signature}`,
            'X-Webhook-Event-Id': event.id,
            'X-Webhook-Event-Type': event.type,
          },
          validateStatus: () => true,
        }),
      );
      if (res.status >= 200 && res.status < 300) {
        await delivery.update({
          status: 'delivered',
          lastStatusCode: res.status,
          lastError: null,
        });
        return;
      }
      await this.markRetry(delivery, maxAttempts, res.status, `HTTP ${res.status}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markRetry(delivery, maxAttempts, null, message);
    }
  }

  private async markRetry(
    delivery: WebhookDelivery,
    maxAttempts: number,
    statusCode: number | null,
    error: string,
  ): Promise<void> {
    if (delivery.attemptCount >= maxAttempts) {
      await delivery.update({
        status: 'failed',
        lastStatusCode: statusCode,
        lastError: error,
        nextAttemptAt: null,
      });
      return;
    }
    // Exponential backoff: 30s * 2^(attempt-1), capped at 1h.
    const delayMs = Math.min(
      30_000 * Math.pow(2, Math.max(0, delivery.attemptCount - 1)),
      60 * 60 * 1000,
    );
    await delivery.update({
      status: 'pending',
      lastStatusCode: statusCode,
      lastError: error,
      nextAttemptAt: new Date(Date.now() + delayMs),
    });
  }
}
