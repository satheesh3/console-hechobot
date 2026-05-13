import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ChannelsModule } from '../channels/channels.module';
import { ClientsModule } from '../clients/clients.module';
import { YcloudModule } from '../ycloud/ycloud.module';
import { MessageLog } from './message-log.model';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MessageLog]),
    ApiKeysModule,
    ChannelsModule,
    ClientsModule,
    YcloudModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService, SequelizeModule],
})
export class MessagesModule {}
