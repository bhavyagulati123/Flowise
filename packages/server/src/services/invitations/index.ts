import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { getDataSource } from '../../DataSource'
import { Invitation } from '../../database/entities/Invitation'
import { OrganizationMember, OrgRole } from '../../database/entities/OrganizationMember'
import { User } from '../../database/entities/User'

const INVITE_TTL_DAYS = 7

const createInvitation = async (orgId: string, invitedByUserId: string, email: string, role: OrgRole) => {
    const ds = getDataSource()
    const inviteRepo = ds.getRepository(Invitation)
    const userRepo = ds.getRepository(User)
    const memberRepo = ds.getRepository(OrganizationMember)

    // Check if already a member
    const existingUser = await userRepo.findOne({ where: { email } })
    if (existingUser) {
        const existingMember = await memberRepo.findOne({ where: { organizationId: orgId, userId: existingUser.id } })
        if (existingMember) throw new Error('User is already a member of this organization')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS)

    const invite = inviteRepo.create({ id: uuidv4(), organizationId: orgId, invitedByUserId, email, role, token, expiresAt })
    await inviteRepo.save(invite)

    return { id: invite.id, email, role, token, expiresAt }
}

const getInvitationByToken = async (token: string) => {
    const ds = getDataSource()
    const invite = await ds.getRepository(Invitation).findOne({ where: { token } })
    if (!invite) throw new Error('Invitation not found')
    if (invite.accepted) throw new Error('Invitation already accepted')
    if (invite.expiresAt < new Date()) throw new Error('Invitation has expired')
    return invite
}

const acceptInvitation = async (token: string, userId: string) => {
    const ds = getDataSource()
    const inviteRepo = ds.getRepository(Invitation)
    const memberRepo = ds.getRepository(OrganizationMember)

    const invite = await getInvitationByToken(token)

    // Check if already a member
    const existing = await memberRepo.findOne({ where: { organizationId: invite.organizationId, userId } })
    if (existing) throw new Error('Already a member of this organization')

    await memberRepo.save(memberRepo.create({
        id: uuidv4(),
        userId,
        organizationId: invite.organizationId,
        role: invite.role
    }))

    await inviteRepo.update({ id: invite.id }, { accepted: true })

    return { organizationId: invite.organizationId, role: invite.role }
}

const revokeInvitation = async (orgId: string, invitationId: string) => {
    const ds = getDataSource()
    const invite = await ds.getRepository(Invitation).findOne({ where: { id: invitationId, organizationId: orgId } })
    if (!invite) throw new Error('Invitation not found')
    await ds.getRepository(Invitation).delete({ id: invitationId })
}

const listInvitations = async (orgId: string) => {
    const ds = getDataSource()
    return ds.getRepository(Invitation).find({ where: { organizationId: orgId, accepted: false } })
}

export default { createInvitation, getInvitationByToken, acceptInvitation, revokeInvitation, listInvitations }
