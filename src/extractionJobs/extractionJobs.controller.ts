import { Controller, Post, Query } from "@nestjs/common";
import { ExtractionJobsService } from "./extractionJobs.service";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { UploadedDocumentDTO } from "../uploadedDocuments/uploadedDocuments.dtos";
import { ExtractionJobRequestDTO } from "./extractionJobs.dtos";

@Controller("/uploaded-documents/extraction-jobs")
export class ExtractionJobsController {
    constructor(
        private readonly extractionJobsService: ExtractionJobsService
    ) { }

    @Post("/classification")
    @ApiOperation({
        summary: 'Trigger Classification Job',
        description: `This will trigger an event to call external IDP API for classification`
    })
    @ApiOkResponse({
        description: 'Successfully POST response UploadedDocumentDTO',
        type: UploadedDocumentDTO,
    })
    async callExternalDocumentClassification(@Query() dto: ExtractionJobRequestDTO): Promise<UploadedDocumentDTO> {
        return await this.extractionJobsService.callExternalDetailExtraction(dto.uploadedDocumentId);
    }

    @Post("/quick-validation")
    @ApiOperation({
        summary: 'Trigger Quick Validation Job',
        description: `This will trigger an event to call external IDP API for Quick Validation`
    })
    @ApiOkResponse({
        description: 'Successfully POST response UploadedDocumentDTO',
        type: UploadedDocumentDTO,
    })
    async callExternalQuickValidation(@Query() dto: ExtractionJobRequestDTO): Promise<UploadedDocumentDTO> {
        return await this.extractionJobsService.callExternalQuickValidation(dto.uploadedDocumentId);
    }

    @Post("/detail-extraction")
    @ApiOperation({
        summary: 'Trigger Detail Extraction Job',
        description: `This will trigger an event to call external IDP API for Detail Extraction`
    })
    @ApiOkResponse({
        description: 'Successfully POST response UploadedDocumentDTO',
        type: UploadedDocumentDTO,
    })
    async callExternalDetailExtraction(@Query() dto: ExtractionJobRequestDTO): Promise<UploadedDocumentDTO> {
        return await this.extractionJobsService.callExternalDetailExtraction(dto.uploadedDocumentId);
    }
}