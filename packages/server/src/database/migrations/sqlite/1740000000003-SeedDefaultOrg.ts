import { MigrationInterface, QueryRunner } from 'typeorm'

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001'

export class SeedDefaultOrg1740000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the default organization for all existing data
        await queryRunner.query(`
            INSERT OR IGNORE INTO "organization" ("id", "slug", "name", "type", "isActive", "createdDate", "updatedDate")
            VALUES ('${DEFAULT_ORG_ID}', 'default', 'Default', 'personal', 1, datetime('now'), datetime('now'))
        `)

        // Backfill all existing resources to default org
        await queryRunner.query(`UPDATE "chat_flow" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "credential" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "tool" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "assistant" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "variable" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "document_store" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "custom_template" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
        await queryRunner.query(`UPDATE "apikey" SET "orgId" = '${DEFAULT_ORG_ID}' WHERE "orgId" IS NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "chat_flow" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "credential" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "tool" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "assistant" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "variable" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "document_store" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "custom_template" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`UPDATE "apikey" SET "orgId" = NULL WHERE "orgId" = '${DEFAULT_ORG_ID}'`)
        await queryRunner.query(`DELETE FROM "organization" WHERE "id" = '${DEFAULT_ORG_ID}'`)
    }
}
