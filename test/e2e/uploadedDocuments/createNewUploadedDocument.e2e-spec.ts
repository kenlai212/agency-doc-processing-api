import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UploadedDocument, UploadedDocumentType } from '../../../src/uploadedDocuments/uploadedDocument.entity';
import { UploadedDocumentsService } from '../../../src/uploadedDocuments/uploadedDocuments.service';
import { UploadDocumentRequestDTO } from '../../../src/uploadedDocuments/uploadedDocuments.dtos';
import { TestingModule } from '@nestjs/testing';
import { createSharedTestModule } from './common';

describe(`Create new Uploaded Document E2E test`, () => {
    let uploadedDocumentsServivce: UploadedDocumentsService;
    let moduleFixture: TestingModule;

    beforeAll(async () => {
        moduleFixture = await createSharedTestModule();
        uploadedDocumentsServivce = moduleFixture.get<UploadedDocumentsService>(UploadedDocumentsService);
    })

    afterAll(async () => {
        const repository = moduleFixture.get(getRepositoryToken(UploadedDocument));
        await repository.query(`DELETE FROM uploaded_document`);
        await moduleFixture.close();
    });

    it(`Successfully create a new Uploaded Document`, async () => {
        let dto = new UploadDocumentRequestDTO();
        dto.actorId = "a8e7e174-8d4e-417d-810a-6d1490234a65";
        dto.uploadedDocumentType = UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT;
        dto.documentBase64 = "BASE64_12345678901234567890"
        const result = await uploadedDocumentsServivce.uploadNewDocument(dto);
        console.log(result);
        expect(result).toBeDefined();
    });
});