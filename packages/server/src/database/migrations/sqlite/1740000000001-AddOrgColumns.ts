import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrgColumns1740000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "tool" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "tool" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "assistant" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "assistant" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "variable" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "variable" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "document_store" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "document_store" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD COLUMN "createdByUserId" varchar`)
        await queryRunner.query(`ALTER TABLE "apikey" ADD COLUMN "orgId" varchar`)
        await queryRunner.query(`ALTER TABLE "apikey" ADD COLUMN "createdByUserId" varchar`)

        // Composite indexes for multi-tenant query performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chat_flow_orgId" ON "chat_flow" ("orgId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_credential_orgId" ON "credential" ("orgId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tool_orgId" ON "tool" ("orgId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_assistant_orgId" ON "assistant" ("orgId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_variable_orgId" ON "variable" ("orgId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_document_store_orgId" ON "document_store" ("orgId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_custom_template_orgId" ON "custom_template" ("orgId")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite does not support DROP COLUMN — down migration is a no-op for SQLite
        // For Postgres/MySQL this would use: ALTER TABLE "chat_flow" DROP COLUMN "orgId"
    }
}
