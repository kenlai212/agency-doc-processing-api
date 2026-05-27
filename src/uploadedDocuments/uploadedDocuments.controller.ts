import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { SearchUploadedDocumentsRequestDTO, SearchUploadedDocumentsResponseDTO, UploadDocumentRequestDTO, UploadedDocumentDTO } from "./uploadedDocuments.dtos";
import { UploadedDocumentsService } from "./uploadedDocuments.service";

@Controller("/uploaded-documents")
export class UploadedDocumentsController {
    constructor(
        private readonly uploadedDocumentsService: UploadedDocumentsService
    ) { }

    @Post("/")
    @ApiOperation({
        summary: 'Upload Document',
        description: `Upload a document (e.g pdf, image) to an existing ActorId. Will send for virus scan, storage facility, data abstraction`
    })
    @ApiOkResponse({
        description: 'Successfully POST response UploadedDocumentDTO',
        type: UploadedDocumentDTO,
    })
    async uploadDocument(@Body() dto: UploadDocumentRequestDTO): Promise<UploadedDocumentDTO> {
        return await this.uploadedDocumentsService.uploadNewDocument(dto);
    }

    @Get("/")
    @ApiOperation({
        summary: 'Search Upload Documents',
        description: `List of Documents`
    })
    @ApiOkResponse({
        description: `Successfully GET response ${SearchUploadedDocumentsResponseDTO.name}`,
        type: SearchUploadedDocumentsResponseDTO,
    })
    async searchUploadedDocuments(@Query() dto: SearchUploadedDocumentsRequestDTO): Promise<SearchUploadedDocumentsResponseDTO> {
        return await this.uploadedDocumentsService.searchUploadedDocuments(dto);
    }
}