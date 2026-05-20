import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ChannelsModule } from '../channels/channels.module';
import { ClientsModule } from '../clients/clients.module';
import { YcloudModule } from '../ycloud/ycloud.module';
import { EmbeddedSignupController } from './embedded-signup.controller';
import { EmbeddedSignupService } from './embedded-signup.service';

@Module({
  imports: [AdminAuthModule, ChannelsModule, ClientsModule, YcloudModule],
  controllers: [EmbeddedSignupController],
  providers: [EmbeddedSignupService],
})
export class EmbeddedSignupModule {}
