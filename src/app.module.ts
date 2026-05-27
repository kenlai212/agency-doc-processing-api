import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './app.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadedDocument } from './uploadedDocuments/uploadedDocument.entity';
import { ExtractionJob } from './extractionJobs/extractionJob.entity';
import { UploadedDocumentsModule } from './uploadedDocuments/uploadedDocuments.module';
import { ExtractionJobsModule } from './extractionJobs/extractionJobs.module';
import { KafkaConsumersModule } from './kafkaConsumers/kafka.consumers.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get("database.host"),
        port: configService.get("database.port"),
        username: configService.get("database.userName"),
        password: configService.get("database.password"),
        database: configService.get("database.databaseName"),
        entities: [
          UploadedDocument,
          ExtractionJob
        ],
        synchronize: true,
        logging: configService.get("database.logging"),
      }),
      inject: [ConfigService]
    }),
    UploadedDocumentsModule,
    ExtractionJobsModule,
    KafkaConsumersModule
  ]
})
export class AppModule { }
