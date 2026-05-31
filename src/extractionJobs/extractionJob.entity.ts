import { randomUUID } from "crypto";
import { BeforeInsert, Column, CreateDateColumn, Generated, UpdateDateColumn } from "typeorm";

export class ExtractionJob {
    @Column({
        nullable: false,
    })
    extractionJobId: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;

    @Column({
        nullable: false,
        type: "varchar",
        length: 36,
        unique: true
    })
    externalExtractionJobIdentifier: string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 36
    })
    externalExtractionJobTemplateId: string;

    @Column({
        nullable: true,
        type: "json"
    })
    extractionResult: JSON;
}