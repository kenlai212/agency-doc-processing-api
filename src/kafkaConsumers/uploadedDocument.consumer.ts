import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { UploadedDocumentKafkaTopics } from '../uploadedDocuments/kafka.producer';
import { UploadedDocumentsService } from '../uploadedDocuments/uploadedDocuments.service';
import { KafkaConsumerService } from './kafka.consumer';
import { ExtractionJobsService } from '../extractionJobs/extractionJobs.service';

@Controller()
export class UploadedDocumentsConsumer extends KafkaConsumerService {
    readonly logger: Logger = new Logger(this.constructor.name)

    constructor(
        private readonly uploadedDocumentsService: UploadedDocumentsService,
        //private readonly extractionJobsService: ExtractionJobsService
    ) {
        super();
    }

    @EventPattern(UploadedDocumentKafkaTopics.DOCUMENT_SUBMITTED)
    async handleDocumentSubmittedEvent(@Payload() payload: any, @Ctx() context: KafkaContext) {
        this.logInboundEvent(payload, context);

        //once document submitted, trigger file scan 
        await this.uploadedDocumentsService.callexternalFileScanService(payload.uploadedDocumentId)
            .catch(error => {
                this.logger.error(error.stack);
            });

        await this.commitOffset(context);
    }

    /*@EventPattern(UploadedDocumentKafkaTopics.SECURITY_SCAN)
    async handleSecurityScanEvent(@Payload() payload: any, @Ctx() context: KafkaContext) {
        this.logInboundEvent(payload, context);

        //once file scanned, trigger classification
        await this.extractionJobsService.callExternalDocumentClassification(payload.uploadedDocumentId)
            .catch(error => {
                this.logger.error(error.stack);
            });

        await this.commitOffset(context);
    }*/
}