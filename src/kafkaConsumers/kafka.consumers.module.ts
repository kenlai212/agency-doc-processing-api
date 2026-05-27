import { Module } from "@nestjs/common";
import { UploadedDocumentsModule } from "../uploadedDocuments/uploadedDocuments.module";
import { ExtractionJobsModule } from "../extractionJobs/extractionJobs.module";

@Module({
    imports: [
        UploadedDocumentsModule,
        ExtractionJobsModule
    ]
})
export class KafkaConsumersModule { }