import { Module } from "@nestjs/common";
import { ExtractionJobsService } from "./extractionJobs.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ExtractionJobsProducerService } from "./extractionJobs.producer";
import { ConfigService } from "@nestjs/config";
import { UploadedDocumentsModule } from "../uploadedDocuments/uploadedDocuments.module";
import { UploadedDocument } from "../uploadedDocuments/uploadedDocument.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([UploadedDocument]),
        ClientsModule.registerAsync([
            {
                name: 'EXTRACT_JOBS_PRODUCER_SERVICE',
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: 'agency-actors-api',
                            brokers: configService.get("kafka.brokers"),
                        },
                        producer: {
                            idempotent: true,
                            retry: {
                                retries: 5,
                                maxRetryTime: 300000,
                            }
                        }
                    },
                }),
                inject: [ConfigService],
            },
        ]),
        UploadedDocumentsModule
    ],
    providers: [
        ExtractionJobsService, ExtractionJobsProducerService
    ],
    exports: [
        ExtractionJobsService
    ]
})
export class ExtractionJobsModule { }