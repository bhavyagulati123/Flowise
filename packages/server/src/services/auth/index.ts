import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getDataSource } from '../../DataSource'
import { User } from '../../database/entities/User'
import { Organization } from '../../database/entities/Organization'
import { OrganizationMember, OrgRole } from '../../database/entities/OrganizationMember'
import { RefreshToken } from '../../database/entities/RefreshToken'
import { signAccessToken, generateRefreshToken, hashToken } from '../../utils/jwt'

const REFRESH_TOKEN_TTL_DAYS = 7

const getDS = () => getDataSource()

const register = async (email: string, password: string, displayName?: string) => {
    const ds = getDS()
    const userRepo = ds.getRepository(User)
    const orgRepo = ds.getRepository(Organization)
    const memberRepo = ds.getRepository(OrganizationMember)

    const existing = await userRepo.findOne({ where: { email } })
    if (existing) throw new Error('Email already registered')

    const passwordHash = await bcrypt.hash(password, 12)
    const userId = uuidv4()
    const orgId = uuidv4()

    // Create user
    const user = userRepo.create({ id: userId, email, displayName, passwordHash, isActive: true })
    await userRepo.save(user)

    // Create personal workspace
    const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + userId.slice(0, 8)
    const org = orgRepo.create({ id: orgId, slug, name: displayName || email.split('@')[0], type: 'personal' })
    await orgRepo.save(org)

    // Make user OWNER of their workspace
    const member = memberRepo.create({ id: uuidv4(), userId, organizationId: orgId, role: OrgRole.OWNER })
    await memberRepo.save(member)

    const { accessToken, refreshToken } = await issueTokens(userId)
    return { user: { id: user.id, email: user.email, displayName: user.displayName }, accessToken, refreshToken, orgId }
}

const login = async (email: string, password: string) => {
    const ds = getDS()
    const userRepo = ds.getRepository(User)

    const user = await userRepo.createQueryBuilder('u')
        .addSelect('u.passwordHash')
        .where('u.email = :email', { email })
        .getOne()

    if (!user || !user.isActive) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('Invalid credentials')

    const { accessToken, refreshToken } = await issueTokens(user.id)
    return { user: { id: user.id, email: user.email, displayName: user.displayName }, accessToken, refreshToken }
}

const refresh = async (rawToken: string) => {
    const ds = getDS()
    const tokenRepo = ds.getRepository(RefreshToken)

    const tokenHash = hashToken(rawToken)
    const record = await tokenRepo.findOne({ where: { tokenHash } })

    if (!record || record.revoked || record.expiresAt < new Date()) {
        // If token exists but is already revoked — possible reuse attack, revoke entire family
        if (record?.familyId) {
            await tokenRepo.update({ familyId: record.familyId }, { revoked: true })
        }
        throw new Error('Invalid or expired refresh token')
    }

    // Revoke old token, issue new pair in the same family
    await tokenRepo.update({ id: record.id }, { revoked: true })
    const { accessToken, refreshToken } = await issueTokens(record.userId, record.familyId)
    return { accessToken, refreshToken }
}

const logout = async (rawToken: string) => {
    const ds = getDS()
    const tokenHash = hashToken(rawToken)
    await ds.getRepository(RefreshToken).update({ tokenHash }, { revoked: true })
}

const getMe = async (userId: string) => {
    const ds = getDS()
    const user = await ds.getRepository(User).findOne({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const memberships = await ds.getRepository(OrganizationMember)
        .createQueryBuilder('m')
        .where('m.userId = :userId', { userId })
        .getMany()

    const orgIds = memberships.map((m: OrganizationMember) => m.organizationId)
    const orgs = orgIds.length > 0
        ? await ds.getRepository(Organization).findByIds(orgIds)
        : []

    return {
        user: { id: user.id, email: user.email, displayName: user.displayName },
        organizations: memberships.map((m: OrganizationMember) => {
            const org = orgs.find((o: Organization) => o.id === m.organizationId)
            return { id: org?.id, slug: org?.slug, name: org?.name, type: org?.type, role: m.role }
        })
    }
}

// Internal helper
const issueTokens = async (userId: string, existingFamilyId?: string) => {
    const ds = getDS()
    const tokenRepo = ds.getRepository(RefreshToken)

    const accessToken = signAccessToken(userId)
    const rawRefresh = generateRefreshToken()
    const familyId = existingFamilyId || uuidv4()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS)

    await tokenRepo.save(tokenRepo.create({
        id: uuidv4(),
        userId,
        tokenHash: hashToken(rawRefresh),
        familyId,
        expiresAt,
        revoked: false
    }))

    return { accessToken, refreshToken: rawRefresh }
}

export default { register, login, refresh, logout, getMe }
