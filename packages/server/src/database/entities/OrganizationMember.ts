import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Unique } from 'typeorm'

export enum OrgRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    EDITOR = 'editor',
    VIEWER = 'viewer'
}

@Entity()
@Unique(['organizationId', 'userId'])
export class OrganizationMember {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    organizationId: string

    @Column()
    userId: string

    @Column({
        type: 'simple-enum',
        enum: OrgRole,
        default: OrgRole.VIEWER
    })
    role: OrgRole

    @CreateDateColumn()
    joinedDate: Date
}
