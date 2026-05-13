import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { YcloudService } from './ycloud.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('ycloud.baseUrl'),
        timeout: 15_000,
        headers: {
          'X-API-Key': config.get<string>('ycloud.apiKey') ?? '',
          'Content-Type': 'application/json',
        },
      }),
    }),
  ],
  providers: [YcloudService],
  exports: [YcloudService],
})
export class YcloudModule {}
