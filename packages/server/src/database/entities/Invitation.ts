import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm'
import { OrgRole } from './OrganizationMember'

@Entity()
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    organizationId: string

    @Column()
    invitedByUserId: string

    @Column()
    email: string

    @Column({
        type: 'simple-enum',
        enum: OrgRole,
        default: OrgRole.VIEWER
    })
    role: OrgRole

    @Column({ unique: true })
    token: string

    @Column({ type: 'datetime' })
    expiresAt: Date

    @Column({ default: false })
    accepted: boolean

    @CreateDateColumn()
    createdDate: Date
}
