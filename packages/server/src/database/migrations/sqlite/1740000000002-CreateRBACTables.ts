import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateRBACTables1740000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                "id" varchar PRIMARY KEY NOT NULL,
                "email" varchar NOT NULL UNIQUE,
                "displayName" varchar,
                "passwordHash" varchar NOT NULL DEFAULT '',
                "isActive" boolean NOT NULL DEFAULT 1,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "organization" (
                "id" varchar PRIMARY KEY NOT NULL,
                "slug" varchar NOT NULL UNIQUE,
                "name" varchar NOT NULL,
                "type" varchar NOT NULL DEFAULT 'personal',
                "settings" text,
                "isActive" boolean NOT NULL DEFAULT 1,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "organization_member" (
                "id" varchar PRIMARY KEY NOT NULL,
                "organizationId" varchar NOT NULL,
                "userId" varchar NOT NULL,
                "role" varchar NOT NULL DEFAULT 'viewer',
                "joinedDate" datetime NOT NULL DEFAULT (datetime('now')),
                UNIQUE ("organizationId", "userId")
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "invitation" (
                "id" varchar PRIMARY KEY NOT NULL,
                "organizationId" varchar NOT NULL,
                "invitedByUserId" varchar NOT NULL,
                "email" varchar NOT NULL,
                "role" varchar NOT NULL DEFAULT 'viewer',
                "token" varchar NOT NULL UNIQUE,
                "expiresAt" datetime NOT NULL,
                "accepted" boolean NOT NULL DEFAULT 0,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "refresh_token" (
                "id" varchar PRIMARY KEY NOT NULL,
                "userId" varchar NOT NULL,
                "tokenHash" varchar NOT NULL UNIQUE,
                "familyId" varchar,
                "expiresAt" datetime NOT NULL,
                "revoked" boolean NOT NULL DEFAULT 0,
                "userAgent" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `)

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_org_member_userId" ON "organization_member" ("userId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_org_member_orgId" ON "organization_member" ("organizationId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refresh_token_userId" ON "refresh_token" ("userId")`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invitation_orgId" ON "invitation" ("organizationId")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "invitation"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "organization_member"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "organization"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "user"`)
    }
}
