import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ExtractionJob } from "./extractionJob.entity";
import { randomUUID } from 'crypto';
import { ExtractionJobsProducerService, UploadedDocumentKafkaTopics } from "./extractionJobs.producer";
import { UploadedDocumentType } from "../uploadedDocuments/uploadedDocument.entity";
import { UploadedDocumentsService } from "../uploadedDocuments/uploadedDocuments.service";
import { UploadedDocumentDTO } from "../uploadedDocuments/uploadedDocuments.dtos";
import { DataSource } from "typeorm";

export enum ExtractionJobType {
    CLASSIFICATION = "CLASSIFICATION",
    QUICK_VALIDATION = "QUICK_VALIDATION",
    DETAIL_EXTRACTION = "DETAIL_EXTRACTION"
}

@Injectable()
export class ExtractionJobsService {
    readonly logger: Logger = new Logger(this.constructor.name)

    constructor(
        private readonly kafkaProducerService: ExtractionJobsProducerService,
        private readonly uploadedDocumentsService: UploadedDocumentsService,
        private dataSource: DataSource
    ) { }

    async callExternalDocumentClassification(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        return await this.saveExtractionJob(uploadedDocumentId, ExtractionJobType.CLASSIFICATION, UploadedDocumentKafkaTopics.CLASSIFICATION);
    }

    async callExternalQuickValidation(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        return await this.saveExtractionJob(uploadedDocumentId, ExtractionJobType.QUICK_VALIDATION, UploadedDocumentKafkaTopics.QUICK_VALIDATION);
    }

    async callExternalDetailExtraction(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        return await this.saveExtractionJob(uploadedDocumentId, ExtractionJobType.DETAIL_EXTRACTION, UploadedDocumentKafkaTopics.DATA_EXTRACTION);
    }

    private async saveExtractionJob(uploadedDocumentId: string, extractionJobType: ExtractionJobType, kafkaTopic: UploadedDocumentKafkaTopics): Promise<UploadedDocumentDTO> {
        let uploadedDocument = await this.uploadedDocumentsService.findUploadedDocumentEntity(uploadedDocumentId);

        ////////////////////set extraction job
        let extractionJob = new ExtractionJob;
        extractionJob.extractionJobId = randomUUID();
        extractionJob.createdAt = new Date();
        extractionJob.updatedAt = new Date();

        const templateId = await this.lookupTemplateId(uploadedDocument.documentType, extractionJobType);
        extractionJob.externalExtractionJobTemplateId = templateId;

        //ACID transaction: call extraction api +  publish event + save record
        return await this.dataSource.transaction(async (entityManager) => {
            await this.kafkaProducerService.produce(kafkaTopic, { uploadedDocumentId });

            extractionJob.externalExtractionJobIdentifier = await this.callExternalExtractionAPI(uploadedDocument.documentBase64, uploadedDocumentId);

            if (!uploadedDocument.extractionJobs)
                uploadedDocument.extractionJobs = [];
            uploadedDocument.extractionJobs.push(extractionJob);

            uploadedDocument = await entityManager.save(uploadedDocument)
                .catch((error) => {
                    this.logger.error(error.stack);
                    throw new InternalServerErrorException("update uploadedDocument not available");
                });

            return this.uploadedDocumentsService.entityToDTO(uploadedDocument);
        });
    }

    async updateExtractionResult(uploadedDocumentId: string, externalExtractionJobIdentifier: string, extractionResult: JSON) {
        let uploadedDocument = await this.uploadedDocumentsService.findUploadedDocumentEntity(uploadedDocumentId);

        let matchingJob = uploadedDocument.extractionJobs.find(job => job.externalExtractionJobIdentifier === externalExtractionJobIdentifier);

        if (!matchingJob)
            throw new BadRequestException(`No matching extraction job for identifier ${externalExtractionJobIdentifier}`);

        await this.callExternalValidationAPI(extractionResult);
        matchingJob.extractionResult = extractionResult;

        return await this.dataSource.transaction(async (entityManager) => {
            uploadedDocument = await entityManager.save(uploadedDocument)
                .catch((error) => {
                    this.logger.error(error.stack);
                    throw new InternalServerErrorException("update uploadedDocument not available");
                });
        });

        //todo populate actor asset
    }

    private async lookupTemplateId(uploadedDocumentType: UploadedDocumentType, extractionJobType: ExtractionJobType): Promise<string> {
        const templates = [
            {
                templateId: "T1_V",
                documentType: UploadedDocumentType.RESUME,
                extractionJobType: ExtractionJobType.QUICK_VALIDATION
            },
            {
                templateId: "T1_E",
                documentType: UploadedDocumentType.RESUME,
                extractionJobType: ExtractionJobType.DETAIL_EXTRACTION
            },
            {
                templateId: "T1_C",
                documentType: UploadedDocumentType.RESUME,
                extractionJobType: ExtractionJobType.CLASSIFICATION
            },
            {
                templateId: "T2_V",
                documentType: UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT,
                extractionJobType: ExtractionJobType.QUICK_VALIDATION
            },
            {
                templateId: "T2_E",
                documentType: UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT,
                extractionJobType: ExtractionJobType.DETAIL_EXTRACTION
            },
            {
                templateId: "T2_C",
                documentType: UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT,
                extractionJobType: ExtractionJobType.CLASSIFICATION
            },
            {
                templateId: "T3_V",
                documentType: UploadedDocumentType.CERTIFICATION_PROOF,
                extractionJobType: ExtractionJobType.QUICK_VALIDATION
            },
            {
                templateId: "T3_E",
                documentType: UploadedDocumentType.CERTIFICATION_PROOF,
                extractionJobType: ExtractionJobType.DETAIL_EXTRACTION
            },
            {
                templateId: "T3_C",
                documentType: UploadedDocumentType.CERTIFICATION_PROOF,
                extractionJobType: ExtractionJobType.CLASSIFICATION
            }
        ]

        const template = templates.find(item => item.documentType === uploadedDocumentType && item.extractionJobType === extractionJobType);

        if (!template)
            throw new BadRequestException(`Invalid Template ID lookup ${uploadedDocumentType} & ${extractionJobType}`);

        this.logger.log(`Found matching template : ${JSON.stringify(template)}`);

        return template.templateId;
    }

    //call external validation API, expect validation result
    private async callExternalValidationAPI(extractionResult: JSON): Promise<string> {
        return "GOOD";
    }

    //call IDP API, expect IDP extractionJobIdentifier
    private async callExternalExtractionAPI(documentBase64: string, templateId: string): Promise<string> {
        return randomUUID();
    }
}