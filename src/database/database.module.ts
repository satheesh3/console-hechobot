import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        logging: config.get<boolean>('db.logging') ? console.log : false,
        autoLoadModels: true,
        // Schema is managed via sequelize-cli migrations. Do not enable sync.
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
