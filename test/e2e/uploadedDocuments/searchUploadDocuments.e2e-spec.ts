import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UploadedDocument, UploadedDocumentType } from '../../../src/uploadedDocuments/uploadedDocument.entity';
import { UploadedDocumentsService } from '../../../src/uploadedDocuments/uploadedDocuments.service';
import { SearchUploadedDocumentsRequestDTO, UploadDocumentRequestDTO } from '../../../src/uploadedDocuments/uploadedDocuments.dtos';
import { TestingModule } from '@nestjs/testing';
import { createSharedTestModule } from './common';

describe(`Create new Uploaded Document E2E test`, () => {
    let uploadedDocumentsServivce: UploadedDocumentsService;
    let moduleFixture: TestingModule;

    beforeAll(async () => {
        moduleFixture = await createSharedTestModule();
        uploadedDocumentsServivce = moduleFixture.get<UploadedDocumentsService>(UploadedDocumentsService);

        let dto1 = new UploadDocumentRequestDTO();
        dto1.actorId = "a8e7e174-8d4e-417d-810a-6d1490234a65";
        dto1.uploadedDocumentType = UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT;
        dto1.documentBase64 = "BASE64_12345678901234567890"
        await uploadedDocumentsServivce.uploadNewDocument(dto1);

        let dto2 = new UploadDocumentRequestDTO();
        dto2.actorId = "a8e7e174-8d4e-417d-810a-6d1490234a65";
        dto2.uploadedDocumentType = UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT;
        dto2.documentBase64 = "BASE64_12345678901234567890"
        await uploadedDocumentsServivce.uploadNewDocument(dto2);

        let dto3 = new UploadDocumentRequestDTO();
        dto3.actorId = "a8e7e174-8d4e-417d-810a-6d1490234a65";
        dto3.uploadedDocumentType = UploadedDocumentType.GOVERMENT_ISSUE_DOCUMENT;
        dto3.documentBase64 = "BASE64_12345678901234567890"
        await uploadedDocumentsServivce.uploadNewDocument(dto3); 5
    })

    afterAll(async () => {
        const repository = moduleFixture.get(getRepositoryToken(UploadedDocument));
        await repository.query(`DELETE FROM uploaded_document`);
        await moduleFixture.close();
    });

    it(`Successfully create a new Uploaded Document`, async () => {
        let dto = new SearchUploadedDocumentsRequestDTO();
        dto.actorId = "a8e7e174-8d4e-417d-810a-6d1490234a65";
        const result = await uploadedDocumentsServivce.searchUploadedDocuments(dto);
        console.log(result);
        expect(result).toBeDefined();
    });
});