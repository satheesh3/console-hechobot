import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ClientsModule } from '../clients/clients.module';
import { AdminChannelsController, ClientChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { WhatsappChannel } from './whatsapp-channel.model';

@Module({
  imports: [
    SequelizeModule.forFeature([WhatsappChannel]),
    AdminAuthModule,
    ApiKeysModule,
    ClientsModule,
  ],
  controllers: [AdminChannelsController, ClientChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService, SequelizeModule],
})
export class ChannelsModule {}
