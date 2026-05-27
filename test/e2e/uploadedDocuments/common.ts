import { TypeOrmModule } from "@nestjs/typeorm";
import { ExtractionJob } from "../../../src/uploadedDocuments/extractionJob.entity";
import * as dotenv from 'dotenv';
import { Test, TestingModule } from "@nestjs/testing";
import { ExtractionJobsService } from "../../../src/uploadedDocuments/extractionJobs.service";
import { UploadedDocumentsService } from "../../../src/uploadedDocuments/uploadedDocuments.service";
import { UploadedDocument } from "../../../src/uploadedDocuments/uploadedDocument.entity";

dotenv.config({ path: '' + __dirname + '/../../../.env' });

export const createSharedTestModule = async (): Promise<TestingModule> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT),
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                entities: [
                    ExtractionJob,
                    UploadedDocument
                ],
                synchronize: true
            }),
            TypeOrmModule.forFeature([ExtractionJob, UploadedDocument])
        ],
        providers: [ExtractionJobsService, UploadedDocumentsService]
    }).compile();

    return moduleFixture;
}