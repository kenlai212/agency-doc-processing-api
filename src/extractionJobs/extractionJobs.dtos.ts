import { ApiProperty } from "@nestjs/swagger";

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