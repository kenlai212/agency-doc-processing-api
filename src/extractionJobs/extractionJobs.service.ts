import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExtractionJob } from "./extractionJob.entity";
import { randomUUID } from 'crypto';
import { ExtractionJobDTO, NewExtractionJobRequestDTO, SearchExtractionJobsRequestDTO } from "./extractionJobs.dtos";
import { ExtractionJobsProducerService, UploadedDocumentKafkaTopics } from "./extractionJobs.producer";
import { UploadedDocumentStatus, UploadedDocumentType } from "../uploadedDocuments/uploadedDocument.entity";
import { UploadedDocumentsService } from "../uploadedDocuments/uploadedDocuments.service";

export enum ExtractionJobType {
    CLASSIFICATION = "CLASSIFICATION",
    QUICK_VALIDATION = "QUICK_VALIDATION",
    DETAIL_EXTRACTION = "DETAIL_EXTRACTION"
}

@Injectable()
export class ExtractionJobsService {
    readonly logger: Logger = new Logger(this.constructor.name)

    constructor(
        @InjectRepository(ExtractionJob)
        private readonly entityRepository: Repository<ExtractionJob>,
        private readonly kafkaProducerService: ExtractionJobsProducerService,
        private readonly uploadedDocumentsService: UploadedDocumentsService
    ) { }

    async callExternalDocumentClassification(uploadedDocumentId: string): Promise<ExtractionJobDTO> {
        let uploadedDocumentDTO = await this.uploadedDocumentsService.getUploadedDocument(uploadedDocumentId);

        let dto = new NewExtractionJobRequestDTO();
        dto.uploadedDocumentId = uploadedDocumentId;
        dto.documentBase64 = uploadedDocumentDTO.documentBase64;
        dto.documentType = uploadedDocumentDTO.documentType;
        dto.extractionJobType = ExtractionJobType.CLASSIFICATION;
        const entity = await this.createNewExtractionJob(dto);

        await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.CLASSIFICATION, { uploadedDocumentId });

        await this.uploadedDocumentsService.updateStatus(uploadedDocumentId, UploadedDocumentStatus.CLASSIFYING);

        return this.entityToDTO(entity);
    }

    async callExternalQuickValidation(uploadedDocumentId: string): Promise<ExtractionJobDTO> {
        let uploadedDocumentDTO = await this.uploadedDocumentsService.getUploadedDocument(uploadedDocumentId);

        let dto = new NewExtractionJobRequestDTO();
        dto.uploadedDocumentId = uploadedDocumentId;
        dto.documentBase64 = uploadedDocumentDTO.documentBase64;
        dto.documentType = uploadedDocumentDTO.documentType;
        dto.extractionJobType = ExtractionJobType.CLASSIFICATION;
        const entity = await this.createNewExtractionJob(dto);

        await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.QUICK_VALIDATION, { uploadedDocumentId });

        await this.uploadedDocumentsService.updateStatus(uploadedDocumentId, UploadedDocumentStatus.VALIDATING);

        return this.entityToDTO(entity);
    }

    async callExternalDetailExtraction(uploadedDocumentId: string): Promise<ExtractionJobDTO> {
        let uploadedDocumentDTO = await this.uploadedDocumentsService.getUploadedDocument(uploadedDocumentId);

        let dto = new NewExtractionJobRequestDTO();
        dto.uploadedDocumentId = uploadedDocumentId;
        dto.documentBase64 = uploadedDocumentDTO.documentBase64;
        dto.documentType = uploadedDocumentDTO.documentType;
        dto.extractionJobType = ExtractionJobType.CLASSIFICATION;
        const entity = await this.createNewExtractionJob(dto);

        await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.DATA_EXTRACTION, { uploadedDocumentId });

        await this.uploadedDocumentsService.updateStatus(uploadedDocumentId, UploadedDocumentStatus.EXTRACTING);

        return this.entityToDTO(entity);
    }

    async createNewExtractionJob(dto: NewExtractionJobRequestDTO): Promise<ExtractionJob> {
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
    }

    async searchExtractionJobs(dto: SearchExtractionJobsRequestDTO): Promise<ExtractionJob[]> {
        let entities = await this.entityRepository.find({ where: { uploadedDocumentId: dto.uploadedDocumentId } })
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("searchExtractionJobs() not available");
            });

        return entities;
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

    private entityToDTO(entity: ExtractionJob) {
        let dto = new ExtractionJobDTO();
        dto.extractionJobId = entity.extractionJobId;
        dto.uploadedDocumentId = entity.uploadedDocumentId;
        dto.extractionJobTemplateId = entity.uploadedDocumentId;
        dto.uploadedAt = entity.createdAt;
        dto.extractionResult = entity.extractionResult;

        return dto;
    }

}