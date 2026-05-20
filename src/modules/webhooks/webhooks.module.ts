import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ChannelsModule } from '../channels/channels.module';
import { ClientsModule } from '../clients/clients.module';
import { MessagesModule } from '../messages/messages.module';
import { MessageLog } from '../messages/message-log.model';
import { YcloudModule } from '../ycloud/ycloud.module';
import { WebhookDelivery } from './webhook-delivery.model';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookEvent } from './webhook-event.model';
import { WebhookIngressController } from './webhook-ingress.controller';
import { WebhookIngressService } from './webhook-ingress.service';
import { WebhookSubscription } from './webhook-subscription.model';
import { WebhookSubscriptionsController } from './webhook-subscriptions.controller';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      WebhookSubscription,
      WebhookEvent,
      WebhookDelivery,
      MessageLog,
    ]),
    HttpModule.register({ timeout: 10_000 }),
    ApiKeysModule,
    ChannelsModule,
    ClientsModule,
    MessagesModule,
    YcloudModule,
  ],
  controllers: [WebhookIngressController, WebhookSubscriptionsController],
  providers: [WebhookIngressService, WebhookDeliveryService, WebhookSubscriptionsService],
  exports: [WebhookSubscriptionsService],
})
export class WebhooksModule {}
