import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";

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

export class ExtractionJobRequestDTO {
    @ApiProperty({
        description: `Uploaded Document Id`,
    })
    @IsUUID()
    @IsNotEmpty()
    uploadedDocumentId: string;
}