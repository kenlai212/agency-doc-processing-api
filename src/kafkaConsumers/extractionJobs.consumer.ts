import { Controller, Logger } from "@nestjs/common";
import { ExtractionJobsService } from "../extractionJobs/extractionJobs.service";
import { Ctx, EventPattern, KafkaContext, Payload } from "@nestjs/microservices";
import { UploadedDocumentKafkaTopics } from "../uploadedDocuments/kafka.producer";
import { KafkaConsumerService } from "./kafka.consumer";

@Controller()
export class ExtractionJobsConsumer extends KafkaConsumerService {
    readonly logger: Logger = new Logger(this.constructor.name)

    constructor(
        private readonly extractionJobsService: ExtractionJobsService
    ) {
        super();
    }

    @EventPattern(UploadedDocumentKafkaTopics.CLASSIFICATION)
    async handleClassificationEvent(@Payload() payload: any, @Ctx() context: KafkaContext) {
        this.logInboundEvent(payload, context);

        //todo, validate classification type

        //once classified, trigger quick validation
        await this.extractionJobsService.callExternalQuickValidation(payload.uploadedDocumentId)
            .catch(error => {
                this.logger.error(error.stack);
            });

        await this.commitOffset(context);
    }

    @EventPattern(UploadedDocumentKafkaTopics.QUICK_VALIDATION)
    async handleQuickValidationEvent(@Payload() payload: any, @Ctx() context: KafkaContext) {
        this.logInboundEvent(payload, context);

        //todo, fuzzy name match

        //todo, validate date expiry

        //once quick validated, trigger detail extraction
        await this.extractionJobsService.callExternalDetailExtraction(payload.uploadedDocumentId)
            .catch(error => {
                this.logger.error(error.stack);
            });

        await this.commitOffset(context);
    }

    @EventPattern(UploadedDocumentKafkaTopics.DATA_EXTRACTION)
    async handleDataExtractionEvent(@Payload() payload: any, @Ctx() context: KafkaContext) {
        this.logInboundEvent(payload, context);

        //todo, populate actor assets

        await this.commitOffset(context);
    }
}