import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as crypto from 'crypto';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import { WebhookSubscription } from './webhook-subscription.model';

@Injectable()
export class WebhookSubscriptionsService {
  constructor(
    @InjectModel(WebhookSubscription)
    private readonly subs: typeof WebhookSubscription,
  ) {}

  create(clientId: string, dto: CreateWebhookSubscriptionDto): Promise<WebhookSubscription> {
    return this.subs.create({
      clientId,
      url: dto.url,
      events: dto.events ?? [],
      signingSecret: `whsec_${crypto.randomBytes(24).toString('hex')}`,
      active: true,
    } as WebhookSubscription);
  }

  listForClient(clientId: string): Promise<WebhookSubscription[]> {
    return this.subs.findAll({ where: { clientId }, order: [['createdAt', 'DESC']] });
  }

  async get(clientId: string, id: string): Promise<WebhookSubscription> {
    const s = await this.subs.findOne({ where: { id, clientId } });
    if (!s) throw new NotFoundException('Webhook subscription not found');
    return s;
  }

  async update(
    clientId: string,
    id: string,
    dto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    const s = await this.get(clientId, id);
    await s.update(dto);
    return s;
  }

  async remove(clientId: string, id: string): Promise<void> {
    const s = await this.get(clientId, id);
    await s.destroy();
  }

  activeForClient(clientId: string): Promise<WebhookSubscription[]> {
    return this.subs.findAll({ where: { clientId, active: true } });
  }
}
