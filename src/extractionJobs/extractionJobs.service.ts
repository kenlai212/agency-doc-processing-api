import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExtractionJob } from "./extractionJob.entity";
import { randomUUID } from 'crypto';
import { ExtractionJobsProducerService, UploadedDocumentKafkaTopics } from "./extractionJobs.producer";
import { UploadedDocument, UploadedDocumentStatus, UploadedDocumentType } from "../uploadedDocuments/uploadedDocument.entity";
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
        let uploadedDocument = await this.uploadedDocumentsService.findUploadedDocumentEntity(uploadedDocumentId);
        uploadedDocument.status = UploadedDocumentStatus.CLASSIFYING;

        ////////////////////set extraction job
        let extractionJob = new ExtractionJob;

        const templateId = await this.lookupTemplateId(uploadedDocument.documentType, ExtractionJobType.CLASSIFICATION);
        extractionJob.externalExtractionJobTemplateId = templateId;

        //ACID transaction: call extraction api +  publish DOCUMENT_SUBMITTED event + save record
        return await this.dataSource.transaction(async (entityManager) => {
            extractionJob.externalExtractionJobIdentifier = await this.callExternalExtractionAPI(uploadedDocument.documentBase64, uploadedDocumentId);

            if (!uploadedDocument.extractionJobs)
                uploadedDocument.extractionJobs = [];
            uploadedDocument.extractionJobs.push(extractionJob);

            uploadedDocument = await entityManager.save(uploadedDocument)
                .catch((error) => {
                    this.logger.error(error.stack);
                    throw new InternalServerErrorException("update uploadedDocument not available");
                });

            await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.DOCUMENT_SUBMITTED, {
                uploadedDocumentId: uploadedDocument.uploadedDocumentId
            });

            return this.uploadedDocumentsService.entityToDTO(uploadedDocument);
        });
    }

    async callExternalQuickValidation(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        let uploadedDocument = await this.uploadedDocumentsService.findUploadedDocumentEntity(uploadedDocumentId);

        ////////////////////set extraction job
        let extractionJob = new ExtractionJob;

        const templateId = await this.lookupTemplateId(uploadedDocument.documentType, ExtractionJobType.CLASSIFICATION);
        extractionJob.externalExtractionJobTemplateId = templateId;

        //ACID transaction: call extraction api +  publish QUICK_VALIDATION event + save record
        return await this.dataSource.transaction(async (entityManager) => {
            await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.QUICK_VALIDATION, { uploadedDocumentId });

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

    async callExternalDetailExtraction(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        let uploadedDocument = await this.uploadedDocumentsService.findUploadedDocumentEntity(uploadedDocumentId);

        ////////////////////set extraction job
        let extractionJob = new ExtractionJob;

        const templateId = await this.lookupTemplateId(uploadedDocument.documentType, ExtractionJobType.CLASSIFICATION);
        extractionJob.externalExtractionJobTemplateId = templateId;

        //ACID transaction: call extraction api +  publish QUICK_VALIDATION event + save record
        return await this.dataSource.transaction(async (entityManager) => {
            await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.DATA_EXTRACTION, { uploadedDocumentId });

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

    /*async createNewExtractionJob(dto: NewExtractionJobRequestDTO): Promise<ExtractionJob> {
        let entity = new ExtractionJob();
        entity.uploadedDocumentId = dto.uploadedDocumentId;

        const templateId = await this.lookupTemplateId(dto.documentType, dto.extractionJobType);
        entity.externalExtractionJobTemplateId = templateId;

        entity.externalExtractionJobIdentifier = await this.callExternalExtractionAPI(dto.documentBase64, templateId)
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("External Extraction API not available");
            });

        await this.entityRepository.save(entity)
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("createNewExtractionJob() not available");
            });

        return entity;
    }

    async updateExtractionResult(externalExtractionJobIdentifier: string, extractionResult: JSON) {
        let entity = await this.entityRepository.findOne({ where: { externalExtractionJobIdentifier } })
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("updateSymanticsData() not available");
            });

        if (!entity)
            throw new BadRequestException(`Invalid externalExtractionJobIdentifier: ${externalExtractionJobIdentifier}`);

        entity.extractionResult = extractionResult;

        await this.entityRepository.save(entity)
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("createNewSymanticsData() not available");
            });

        //todo validation of extraction result
        //todo populate actor asset
    }*/

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
                templateId: "T2_V",
                documentType: UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT,
                extractionJobType: ExtractionJobType.QUICK_VALIDATION
            },
            {
                templateId: "T2_E",
                documentType: UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT,
                extractionJobType: ExtractionJobType.DETAIL_EXTRACTION
            }
        ]

        const template = templates.find(item => item.documentType === uploadedDocumentType && item.extractionJobType === extractionJobType);

        if (!template)
            throw new BadRequestException(`Invalid ${uploadedDocumentType} & ${extractionJobType}`);

        this.logger.log(`Found matching template : ${JSON.stringify(template)}`);

        return template.templateId;
    }

    //call IDP API, expect IDP extractionJobIdentifier
    private async callExternalExtractionAPI(documentBase64: string, templateId: string): Promise<string> {
        return randomUUID();
    }
}