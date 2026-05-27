import { Controller, Get, Query } from "@nestjs/common";
import { ExtractionJobsService } from "./extractionJobs.service";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { ExtractionJob } from "./extractionJob.entity";
import { SearchExtractionJobsRequestDTO } from "./extractionJobs.dtos";

@Controller("/extraction-jobs")
export class ExtractionJobsController {
    constructor(
        private readonly extractionJobsService: ExtractionJobsService
    ) { }

    @Get("/")
    @ApiOperation({
        summary: 'Search all Extraction Jobs for a document',
        description: `List of Extraction Jobs`
    })
    @ApiOkResponse({
        description: `Successfully GET response ${ExtractionJob.name}`,
        type: ExtractionJob,
    })
    async searchUploadedDocuments(@Query() dto: SearchExtractionJobsRequestDTO): Promise<ExtractionJob[]> {
        return await this.extractionJobsService.searchExtractionJobs(dto);
    }
}