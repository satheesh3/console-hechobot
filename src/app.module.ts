import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ClientsModule } from './modules/clients/clients.module';
import { EmbeddedSignupModule } from './modules/embedded-signup/embedded-signup.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { YcloudModule } from './modules/ycloud/ycloud.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    YcloudModule,
    AdminAuthModule,
    ClientsModule,
    ApiKeysModule,
    ChannelsModule,
    MessagesModule,
    TemplatesModule,
    WebhooksModule,
    EmbeddedSignupModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
