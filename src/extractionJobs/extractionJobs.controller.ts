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
}