import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StorageFacility, UploadedDocument, UploadedDocumentStatus } from "./uploadedDocument.entity";
import { Between, Repository } from "typeorm";
import { SearchUploadedDocumentsRequestDTO, SearchUploadedDocumentsResponseDTO, UploadDocumentRequestDTO, UploadedDocumentDTO } from "./uploadedDocuments.dtos";
import { validate } from "class-validator";
import { KafkaProducerService, UploadedDocumentKafkaTopics } from "./kafka.producer";
import { DataSource } from "typeorm";

@Injectable()
export class UploadedDocumentsService {
    readonly logger: Logger = new Logger(this.constructor.name)

    constructor(
        @InjectRepository(UploadedDocument)
        private readonly entityRepository: Repository<UploadedDocument>,
        private readonly kafkaProducerService: KafkaProducerService,
        private dataSource: DataSource
    ) { }

    async uploadNewDocument(dto: UploadDocumentRequestDTO): Promise<UploadedDocumentDTO> {
        /*const validationErrors = await validate(dto);
        if (validationErrors.length > 0) {
            this.logger.warn(validationErrors);
            throw new BadRequestException(validationErrors.toString());
        }*/

        let entity = new UploadedDocument();

        await this.validateActorId(dto.actorId);
        entity.actorId = dto.actorId;

        entity.documentType = dto.uploadedDocumentType;

        //TODO validate asset ID
        if (dto.assetId)
            entity.assetId = dto.assetId;

        entity.status = UploadedDocumentStatus.SUBMITTED;

        entity.documentBase64 = dto.documentBase64;

        return await this.dataSource.transaction(async (entityManager) => {
            entity = await this.entityRepository.save(entity)
                .catch((error) => {
                    this.logger.error(error.stack);
                    throw new InternalServerErrorException("uploadNewDocument() not available");
                });

            await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.DOCUMENT_SUBMITTED, {
                uploadedDocumentId: entity.uploadedDocumentId
            });

            return this.entityToDTO(entity);
        });

    }

    async searchUploadedDocuments(dto: SearchUploadedDocumentsRequestDTO): Promise<SearchUploadedDocumentsResponseDTO> {
        let whereClause: any = {}

        whereClause.actorId = dto.actorId;

        if (dto.searchRangeStart) {
            if (!dto.searchRangeEnd)
                dto.searchRangeEnd = new Date();

            whereClause.createdAt = Between(dto.searchRangeStart, dto.searchRangeEnd)
        }

        const documents = await this.entityRepository.find({
            where: whereClause
        })
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("searchUploadedDocuments() not available");
            });

        let respone = new SearchUploadedDocumentsResponseDTO();
        respone.documents = [];
        documents.forEach(document => {
            respone.documents.push(this.entityToDTO(document));
        });

        return respone;
    }

    async callexternalFileScanService(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        let entity = await this.findUploadedDocumentEntity(uploadedDocumentId);

        //todo call file scan api

        entity.status = UploadedDocumentStatus.SCANNED;

        return await this.dataSource.transaction(async (entityManager) => {
            await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.SECURITY_SCAN, {
                uploadedDocumentId: entity.uploadedDocumentId
            });

            return this.saveUploadedDocument(entity);
        });
    }

    async callExternalStorageService(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        let entity = await this.findUploadedDocumentEntity(uploadedDocumentId);

        //todo make this configurable
        entity.storageFacility = StorageFacility.ALFRESCO;

        //todo call doc store api and set storageRecordId;
        entity.storageRecordId = "ALFRESCO1234"

        entity.status = UploadedDocumentStatus.UPLOADED;

        /*await this.kafkaProducerService.produce(UploadedDocumentKafkaTopics.STORAGE_COMPLETE, {
            uploadedDocumentId: entity.uploadedDocumentId
        });*/

        return this.saveUploadedDocument(entity);
    }

    async updateStatus(uploadedDocumentId: string, status: UploadedDocumentStatus) {
        let entity = await this.findUploadedDocumentEntity(uploadedDocumentId);

        entity.status = status;

        return this.saveUploadedDocument(entity);
    }

    private async validateActorId(actorId: string) {
        return true
    }

    private async findUploadedDocumentEntity(uploadedDocumentId: string): Promise<UploadedDocument> {
        let entity = await this.entityRepository.findOne({ where: { uploadedDocumentId } })
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("getUploadedDocument() not available");
            });

        if (!entity)
            throw new BadRequestException(`Invalid uploadedDocumentId: ${uploadedDocumentId}`);

        return entity;
    }

    async getUploadedDocument(uploadedDocumentId: string): Promise<UploadedDocumentDTO> {
        let entity = await this.entityRepository.findOne({ where: { uploadedDocumentId } })
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("getUploadedDocument() not available");
            });

        if (!entity)
            throw new BadRequestException(`Invalid uploadedDocumentId: ${uploadedDocumentId}`);

        return this.entityToDTO(entity);
    }

    private async saveUploadedDocument(entity: UploadedDocument): Promise<UploadedDocumentDTO> {
        entity = await this.entityRepository.save(entity)
            .catch((error) => {
                this.logger.error(error.stack);
                throw new InternalServerErrorException("saveUploadedDocument() not available");
            });

        return this.entityToDTO(entity);
    }

    entityToDTO(entity: UploadedDocument): UploadedDocumentDTO {
        let dto = new UploadedDocumentDTO;
        dto.uploadedDocumentId = entity.uploadedDocumentId;
        dto.documentType = entity.documentType;
        dto.actorId = entity.actorId;
        dto.assetId = entity.assetId;
        dto.storageFacility = entity.storageFacility;
        dto.storageRecordId = entity.storageRecordId;
        dto.uploadedAt = entity.createdAt;
        dto.status = entity.status;
        dto.documentBase64 = entity.documentBase64;

        return dto;
    }
}