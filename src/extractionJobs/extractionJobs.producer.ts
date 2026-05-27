import { Inject, Injectable, InternalServerErrorException, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";

export enum UploadedDocumentKafkaTopics {
    DOCUMENT_SUBMITTED = "DOCUMENT_SUBMITTED",
    SECURITY_SCAN = "SECURITY_SCAN",
    STORAGE_COMPLETE = "STORAGE_COMPLETE",
    CLASSIFICATION = "CLASSIFICATION",
    QUICK_VALIDATION = "QUICK_VALIDATION",
    DATA_EXTRACTION = "DATA_EXTRACTION"
}

@Injectable()
export class ExtractionJobsProducerService implements OnModuleInit, OnModuleDestroy {
    readonly logger: Logger = new Logger(this.constructor.name)

    @Inject('EXTRACT_JOBS_PRODUCER_SERVICE') private readonly kafkaClient: ClientKafka

    async onModuleInit() {
        // Connect the client when the module initializes
        try {
            await this.kafkaClient.connect();
            this.logger.log("Kafka Producer Client connected successfully");
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(`Failed to connect to Kafka brokers`);
        }
    }

    async produce(topic: UploadedDocumentKafkaTopics, payload: any) {
        this.kafkaClient.emit(topic, payload)
            .subscribe({
                next: (response) => {
                    this.logger.log(`Message published successfully to topic: ${response[0].topicName}, baseOffset: ${response[0].baseOffset}`)
                },
                error: (err) => {
                    this.logger.error(err.stack);
                }
            });
    }

    async onModuleDestroy() {
        // Disconnect the client when the application shuts down
        await this.kafkaClient.close();
        this.logger.log("Kafka Producer Client disconnected");
    }
}