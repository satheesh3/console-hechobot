import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChannelsService } from '../channels/channels.service';
import { MessageLog } from '../messages/message-log.model';
import { WebhookEvent } from './webhook-event.model';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';

// Normalised internal shape for what we hand to clients. YCloud's actual
// payloads can vary; we mirror the relevant subset and pass the original
// payload through under `raw`.
interface NormalisedEvent {
  type: string;
  providerEventId: string | null;
  clientId: string | null;
  channelId: string | null;
  data: Record<string, unknown>;
}

@Injectable()
export class WebhookIngressService {
  private readonly logger = new Logger(WebhookIngressService.name);

  constructor(
    @InjectModel(WebhookEvent) private readonly events: typeof WebhookEvent,
    @InjectModel(MessageLog) private readonly messageLogs: typeof MessageLog,
    private readonly channels: ChannelsService,
    private readonly subs: WebhookSubscriptionsService,
    private readonly delivery: WebhookDeliveryService,
  ) {}

  async ingest(payload: Record<string, unknown>): Promise<void> {
    const normalised = await this.normalise(payload);

    if (normalised.providerEventId) {
      const existing = await this.events.findOne({
        where: { providerEventId: normalised.providerEventId },
      });
      if (existing) {
        this.logger.debug(`Ignoring duplicate event ${normalised.providerEventId}`);
        return;
      }
    }

    const event = await this.events.create({
      clientId: normalised.clientId,
      type: normalised.type,
      providerEventId: normalised.providerEventId,
      payload: { ...normalised.data, raw: payload },
    } as WebhookEvent);

    if (normalised.type.startsWith('message.')) {
      await this.applyMessageStatusUpdate(normalised);
    }

    if (!normalised.clientId) {
      this.logger.warn(
        `Event ${event.id} (${event.type}) has no resolvable client — stored, not fanned out.`,
      );
      return;
    }

    const subscriptions = await this.subs.activeForClient(normalised.clientId);
    if (subscriptions.length === 0) return;
    await this.delivery.enqueueFanout(event, subscriptions);
  }

  private async normalise(payload: Record<string, unknown>): Promise<NormalisedEvent> {
    const type = String(payload.type ?? payload.event ?? 'unknown');
    const providerEventId = (payload.id as string) ?? null;

    // Try to resolve which client this event is for by looking up the channel
    // via the phone_number_id present in the payload.
    let clientId: string | null = null;
    let channelId: string | null = null;

    const phoneNumberId =
      (payload.phoneNumberId as string | undefined) ??
      ((payload.whatsapp as Record<string, unknown> | undefined)?.phoneNumberId as
        | string
        | undefined) ??
      undefined;

    if (phoneNumberId) {
      const channel = await this.channels.findByPhoneNumberId(phoneNumberId);
      if (channel) {
        clientId = channel.clientId;
        channelId = channel.id;
      }
    }

    return { type, providerEventId, clientId, channelId, data: payload };
  }

  private async applyMessageStatusUpdate(event: NormalisedEvent): Promise<void> {
    const wamid =
      (event.data.wamid as string | undefined) ??
      ((event.data.message as Record<string, unknown> | undefined)?.wamid as string | undefined);
    if (!wamid) return;

    const statusMap: Record<string, string> = {
      'message.sent': 'sent',
      'message.delivered': 'delivered',
      'message.read': 'read',
      'message.failed': 'failed',
      'message.received': 'received',
    };
    const status = statusMap[event.type];
    if (!status) return;

    const log = await this.messageLogs.findOne({ where: { providerMessageId: wamid } });
    if (!log) return;
    await log.update({ status: status as never });
  }
}
