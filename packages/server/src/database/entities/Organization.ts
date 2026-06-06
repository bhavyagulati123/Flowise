import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: true })
    slug: string

    @Column()
    name: string

    @Column({ default: 'personal' })
    type: string

    @Column({ nullable: true, type: 'text' })
    settings: string

    @Column({ default: true })
    isActive: boolean

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date
}
