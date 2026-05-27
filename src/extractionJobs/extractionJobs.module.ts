import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExtractionJobsService } from "./extractionJobs.service";
import { ExtractionJob } from "./extractionJob.entity";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ExtractionJobsProducerService } from "./extractionJobs.producer";
import { ConfigService } from "@nestjs/config";
import { ExtractionJobsController } from "./extractionJobs.controller";
import { UploadedDocumentsModule } from "../uploadedDocuments/uploadedDocuments.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([ExtractionJob]),
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
    controllers: [
        ExtractionJobsController
    ],
    providers: [
        ExtractionJobsService, ExtractionJobsProducerService
    ],
    exports: [
        ExtractionJobsService
    ]
})
export class ExtractionJobsModule { }