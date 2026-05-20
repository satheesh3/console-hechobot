import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { Client } from './client.model';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [SequelizeModule.forFeature([Client]), AdminAuthModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService, SequelizeModule],
})
export class ClientsModule {}
