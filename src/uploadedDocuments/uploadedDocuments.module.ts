import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadedDocument } from "./uploadedDocument.entity";
import { UploadedDocumentsService } from "./uploadedDocuments.service";
import { UploadedDocumentsController } from "./uploadedDocuments.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { UploadedDocumentsConsumer } from "../kafkaConsumers/uploadedDocument.consumer";
import { KafkaProducerService } from "./kafka.producer";
import { ConfigService } from "@nestjs/config";

@Module({
    imports: [
        TypeOrmModule.forFeature([UploadedDocument]),
        ClientsModule.registerAsync([
            {
                name: 'UPLOADED_DOCUMENTS_PRODUCER_SERVICE',
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
    ],
    controllers: [
        UploadedDocumentsController, UploadedDocumentsConsumer
    ],
    providers: [
        UploadedDocumentsService, KafkaProducerService
    ],
    exports: [
        UploadedDocumentsService
    ]
})
export class UploadedDocumentsModule { }