import { v4 as uuidv4 } from 'uuid'
import { getDataSource } from '../../DataSource'
import { Organization } from '../../database/entities/Organization'
import { OrganizationMember, OrgRole } from '../../database/entities/OrganizationMember'

const getOrganizations = async (userId: string) => {
    const ds = getDataSource()
    const memberships = await ds.getRepository(OrganizationMember)
        .createQueryBuilder('m')
        .where('m.userId = :userId', { userId })
        .getMany()

    const orgIds = memberships.map((m: OrganizationMember) => m.organizationId)
    const orgs = orgIds.length > 0
        ? await ds.getRepository(Organization).findByIds(orgIds)
        : []

    return memberships
        .map((m: OrganizationMember) => {
            const org = orgs.find((o: Organization) => o.id === m.organizationId)
            if (!org || !org.isActive) return null
            return { id: org.id, slug: org.slug, name: org.name, type: org.type, role: m.role, joinedDate: m.joinedDate }
        })
        .filter(Boolean)
}

const createOrganization = async (userId: string, name: string, type: string = 'team') => {
    const ds = getDataSource()
    const orgRepo = ds.getRepository(Organization)
    const memberRepo = ds.getRepository(OrganizationMember)

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + uuidv4().slice(0, 8)
    const orgId = uuidv4()

    const org = orgRepo.create({ id: orgId, slug, name, type })
    await orgRepo.save(org)

    const member = memberRepo.create({ id: uuidv4(), userId, organizationId: orgId, role: OrgRole.OWNER })
    await memberRepo.save(member)

    return { id: org.id, slug: org.slug, name: org.name, type: org.type, role: OrgRole.OWNER }
}

const getOrganization = async (orgId: string) => {
    const ds = getDataSource()
    return ds.getRepository(Organization).findOne({ where: { id: orgId, isActive: true } })
}

const getMembers = async (orgId: string) => {
    const ds = getDataSource()
    const members = await ds.getRepository(OrganizationMember)
        .createQueryBuilder('m')
        .where('m.organizationId = :orgId', { orgId })
        .getMany()

    const userIds = members.map((m: OrganizationMember) => m.userId)
    const { User } = await import('../../database/entities/User')
    const users = userIds.length > 0 ? await ds.getRepository(User).findByIds(userIds) : []

    return members.map((m: OrganizationMember) => {
        const user = users.find((u: any) => u.id === m.userId)
        return { userId: m.userId, email: user?.email, displayName: user?.displayName, role: m.role, joinedDate: m.joinedDate }
    })
}

const updateMemberRole = async (orgId: string, targetUserId: string, newRole: OrgRole, requestorRole: OrgRole) => {
    // ADMIN cannot promote to OWNER
    if (newRole === OrgRole.OWNER && requestorRole !== OrgRole.OWNER) {
        throw new Error('Only an OWNER can assign the OWNER role')
    }

    const ds = getDataSource()
    const memberRepo = ds.getRepository(OrganizationMember)
    const member = await memberRepo.findOne({ where: { organizationId: orgId, userId: targetUserId } })
    if (!member) throw new Error('Member not found')

    // Cannot demote the last owner
    if (member.role === OrgRole.OWNER && newRole !== OrgRole.OWNER) {
        const ownerCount = await memberRepo.count({ where: { organizationId: orgId, role: OrgRole.OWNER } })
        if (ownerCount <= 1) throw new Error('Cannot remove the last owner')
    }

    await memberRepo.update({ id: member.id }, { role: newRole })
    return { userId: targetUserId, role: newRole }
}

const removeMember = async (orgId: string, targetUserId: string) => {
    const ds = getDataSource()
    const memberRepo = ds.getRepository(OrganizationMember)
    const member = await memberRepo.findOne({ where: { organizationId: orgId, userId: targetUserId } })
    if (!member) throw new Error('Member not found')

    if (member.role === OrgRole.OWNER) {
        const ownerCount = await memberRepo.count({ where: { organizationId: orgId, role: OrgRole.OWNER } })
        if (ownerCount <= 1) throw new Error('Cannot remove the last owner')
    }

    await memberRepo.delete({ id: member.id })
}

export default { getOrganizations, createOrganization, getOrganization, getMembers, updateMemberRole, removeMember }
