import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ApiKey } from './api-key.model';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [SequelizeModule.forFeature([ApiKey]), AdminAuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService, SequelizeModule],
})
export class ApiKeysModule {}
