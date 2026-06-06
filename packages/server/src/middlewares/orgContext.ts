import { Request, Response, NextFunction } from 'express'
import { OrgRole, OrganizationMember } from '../database/entities/OrganizationMember'
import { Organization } from '../database/entities/Organization'
import { getDataSource } from '../DataSource'

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001'

export const resolveOrgContext = async (req: Request, res: Response, next: NextFunction) => {
    const identity = (req as any).identity
    if (!identity) return next()

    // System user always uses default org
    if (identity.authMethod === 'none' || identity.authMethod === 'basic' || identity.authMethod === 'internal') {
        identity.orgId = identity.orgId || DEFAULT_ORG_ID
        identity.orgRole = OrgRole.OWNER
        return next()
    }

    // API key already has orgId resolved in authentication middleware
    if (identity.authMethod === 'apikey') return next()

    // For JWT auth: resolve org from header, URL param, or fallback to personal org
    const requestedOrgId = (req.headers['x-org-id'] as string) || req.params?.orgId || identity.orgId

    if (!requestedOrgId || requestedOrgId === DEFAULT_ORG_ID) {
        identity.orgId = requestedOrgId || DEFAULT_ORG_ID
        return next()
    }

    try {
        const ds = getDataSource()
        const member = await ds.getRepository(OrganizationMember)
            .findOne({ where: { userId: identity.userId, organizationId: requestedOrgId } })

        if (!member) {
            // Try by slug
            const org = await ds.getRepository(Organization).findOne({ where: { slug: requestedOrgId } })
            if (org) {
                const memberBySlug = await ds.getRepository(OrganizationMember)
                    .findOne({ where: { userId: identity.userId, organizationId: org.id } })
                if (memberBySlug) {
                    identity.orgId = org.id
                    identity.orgRole = memberBySlug.role
                    return next()
                }
            }
            return res.status(403).json({ error: 'Not a member of this organization' })
        }

        identity.orgId = requestedOrgId
        identity.orgRole = member.role
        next()
    } catch {
        next()
    }
}
