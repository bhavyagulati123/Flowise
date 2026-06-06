import { Repository, FindManyOptions, FindOneOptions, ObjectLiteral } from 'typeorm'

export class OrgScopedRepository<T extends ObjectLiteral & { orgId?: string }> {
    constructor(private repo: Repository<T>, private orgId: string) {}

    find(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repo.find({
            ...options,
            where: { ...(options?.where as object), orgId: this.orgId } as any
        })
    }

    findOne(options: FindOneOptions<T>): Promise<T | null> {
        return this.repo.findOne({
            ...options,
            where: { ...(options?.where as object), orgId: this.orgId } as any
        })
    }

    count(options?: FindManyOptions<T>): Promise<number> {
        return this.repo.count({
            ...options,
            where: { ...(options?.where as object), orgId: this.orgId } as any
        })
    }

    save(entity: Partial<T>): Promise<T> {
        return this.repo.save({ ...entity, orgId: this.orgId } as any)
    }

    delete(criteria: Partial<T>): Promise<any> {
        return this.repo.delete({ ...criteria, orgId: this.orgId } as any)
    }

    createQueryBuilder(alias: string) {
        return this.repo.createQueryBuilder(alias).where(`${alias}.orgId = :_scopedOrgId`, { _scopedOrgId: this.orgId })
    }
}
