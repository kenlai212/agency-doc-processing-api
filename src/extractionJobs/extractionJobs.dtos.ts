import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ExtractionJobType } from "./extractionJobs.service";
import { UploadedDocumentType } from "../uploadedDocuments/uploadedDocument.entity";

export class ExtractionJobDTO {
    @ApiProperty({
        description: `Extraction Job Id`,
    })
    extractionJobId: string;

    @ApiProperty({
        description: `Uploaded Document Id`,
    })
    uploadedDocumentId: string;

    @ApiProperty({
        description: `Extraction Job Template ID`,
    })
    extractionJobTemplateId: string;

    @ApiProperty({
        description: `Upload DateTime stamp`,
    })
    uploadedAt: Date;

    @ApiProperty({
        description: `Extraction Job result`,
    })
    extractionResult: JSON;
}

export class SearchExtractionJobsRequestDTO {
    @ApiProperty({
        description: `Uploaded Document Id`,
    })
    @IsUUID()
    @IsNotEmpty()
    uploadedDocumentId: string;
}

export class NewExtractionJobRequestDTO {
    @ApiProperty({
        description: `Uploaded Document Id`,
    })
    @IsUUID()
    @IsNotEmpty()
    uploadedDocumentId: string;

    @ApiProperty({
        description: `Document Base64`,
    })
    @IsString()
    @IsNotEmpty()
    documentBase64: string;

    @ApiProperty({
        //description: `Uploaded Document Type: ${Object.keys(UploadedDocumentType)}`,
    })
    //@IsEnum(UploadedDocumentType)
    @IsNotEmpty()
    documentType: UploadedDocumentType;

    @ApiProperty({
        //description: `Extraction Job Type: ${Object.keys(ExtractionJobType)}`,
    })
    //@IsEnum(ExtractionJobType)
    @IsNotEmpty()
    extractionJobType: ExtractionJobType;
}