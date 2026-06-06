import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @Column({ unique: true })
    tokenHash: string

    @Column({ nullable: true })
    familyId: string

    @Column({ type: 'datetime' })
    expiresAt: Date

    @Column({ default: false })
    revoked: boolean

    @Column({ nullable: true })
    userAgent: string

    @CreateDateColumn()
    createdDate: Date
}
