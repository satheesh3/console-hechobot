import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ChannelsModule } from '../channels/channels.module';
import { ClientsModule } from '../clients/clients.module';
import { YcloudModule } from '../ycloud/ycloud.module';
import { MessageTemplate } from './template.model';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MessageTemplate]),
    ApiKeysModule,
    ChannelsModule,
    ClientsModule,
    YcloudModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
