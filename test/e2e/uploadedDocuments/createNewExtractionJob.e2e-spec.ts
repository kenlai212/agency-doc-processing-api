import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExtractionJobsService, ExtractionJobType } from '../../../src/uploadedDocuments/extractionJobs.service';
import { ExtractionJob } from '../../../src/uploadedDocuments/extractionJob.entity';
import { UploadedDocumentType } from '../../../src/uploadedDocuments/uploadedDocument.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { createSharedTestModule } from './common';

describe(`Create new Extraction Job E2E test`, () => {
    let extractionJobsService: ExtractionJobsService;
    let moduleFixture: TestingModule;

    beforeAll(async () => {
        moduleFixture = await createSharedTestModule();
        extractionJobsService = moduleFixture.get<ExtractionJobsService>(ExtractionJobsService);
    })

    afterAll(async () => {
        const repository = moduleFixture.get(getRepositoryToken(ExtractionJob));
        await repository.query(`DELETE FROM extraction_job`);
        await moduleFixture.close();
    });

    it(`Successfully create a new Extraction Job`, async () => {
        const result = await extractionJobsService.createNewExtractionJob("UPLOADED_DOC_123", "base64StringSample", UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT, ExtractionJobType.QUICK_VALIDATION)
        console.log(result);
        expect(result).toBeDefined();
    });
});