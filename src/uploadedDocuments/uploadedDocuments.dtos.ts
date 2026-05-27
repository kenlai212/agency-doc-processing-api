import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StorageFacility, UploadedDocumentStatus, UploadedDocumentType } from "./uploadedDocument.entity";
import { IsDate, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UploadedDocumentDTO {
    @ApiPropertyOptional({
        description: `Uploaded Document ID`,
    })
    uploadedDocumentId: string;

    @ApiPropertyOptional({
        description: `Uploaded Document belong to this Asset ID`,
    })
    assetId: string;

    @ApiProperty({
        description: `Uploaded Document belong to this Actor Id`,
    })
    actorId: string;

    @ApiProperty({
        description: `Uploaded Document Type ${Object.values(UploadedDocumentType)}`,
        enum: UploadedDocumentType,
        enumName: "UploadedDocumentType"
    })
    documentType: UploadedDocumentType;

    @ApiProperty({
        description: `Storage Facility ${Object.values(StorageFacility)}`,
        enum: StorageFacility,
        enumName: "StorageFacility"
    })
    storageFacility: StorageFacility;

    @ApiProperty({
        description: `Storage Record ID assigned by Storage Facility`,
    })
    storageRecordId: string;

    @ApiProperty({
        description: `Uploaded Timestamp`,
    })
    @IsDate()
    @IsNotEmpty()
    uploadedAt: Date;

    @ApiProperty({
        description: `Upload Docuent Status: ${Object.values(UploadedDocumentStatus)}`,
        enum: UploadedDocumentStatus,
        enumName: "UploadedDocumentStatus"
    })
    status: UploadedDocumentStatus;

    @ApiProperty({
        description: `Document Base64 string`,
    })
    documentBase64: string;
}

export class UploadDocumentRequestDTO {
    @ApiProperty({
        description: `Uploaded Document belong to this Actor Id`,
    })
    @IsUUID()
    @IsNotEmpty()
    actorId: string;

    @ApiPropertyOptional({
        description: `Uploaded Document belong to this Asset Id`,
    })
    @IsUUID()
    @IsOptional()
    assetId!: string;

    @ApiProperty({
        description: `Uploaded Document Type ${Object.values(UploadedDocumentType)}`,
        enum: UploadedDocumentType,
        enumName: "UploadedDocumentType"
    })
    @IsNotEmpty()
    @IsEnum(UploadedDocumentType)
    uploadedDocumentType: UploadedDocumentType;

    @ApiProperty({
        description: `Document Base64 string`,
    })
    @IsString()
    @IsNotEmpty()
    documentBase64: string;
}

export class SearchUploadedDocumentsRequestDTO {
    @ApiProperty({
        description: `Actor Id`,
    })
    @IsUUID()
    @IsNotEmpty()
    actorId: string;

    @ApiPropertyOptional({
        description: `Uploaded Date search range start`,
        example: `2026-05-01`
    })
    @IsDateString()
    @IsOptional()
    searchRangeStart: Date;

    @ApiPropertyOptional({
        description: `Uploaded Date search range end`,
        example: `2026-05-01`
    })
    @IsDateString()
    @IsOptional()
    searchRangeEnd!: Date;
}

export class SearchUploadedDocumentsResponseDTO {
    @ApiProperty({
        description: `List of Uploaded Documents fitting the search date range`
    })
    documents: UploadedDocumentDTO[]
}