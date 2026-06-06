import { Request, Response, NextFunction } from 'express'
import { OrgRole } from '../database/entities/OrganizationMember'
import { OrganizationMember } from '../database/entities/OrganizationMember'
import { getDataSource } from '../DataSource'

const ROLE_PERMISSIONS: Record<OrgRole, string[]> = {
    [OrgRole.VIEWER]: ['read'],
    [OrgRole.EDITOR]: ['read', 'write'],
    [OrgRole.ADMIN]: ['read', 'write', 'delete', 'manage_members'],
    [OrgRole.OWNER]: ['read', 'write', 'delete', 'manage_members', 'manage_org']
}

export const requirePermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const identity = (req as any).identity
        if (!identity) return res.status(401).json({ error: 'Not authenticated' })

        // Resolve role if not already on identity
        let role: OrgRole | undefined = identity.orgRole
        if (!role && identity.orgId && identity.userId !== '00000000-0000-0000-0000-000000000000') {
            try {
                const member = await getDataSource()
                    .getRepository(OrganizationMember)
                    .findOne({ where: { userId: identity.userId, organizationId: identity.orgId } })
                role = member?.role
                if (role) identity.orgRole = role
            } catch {
                return res.status(500).json({ error: 'Failed to resolve permissions' })
            }
        }

        // System user always has owner permissions
        if (identity.userId === '00000000-0000-0000-0000-000000000000') return next()

        const allowed = role ? ROLE_PERMISSIONS[role]?.includes(permission) : false
        if (!allowed) return res.status(403).json({ error: 'Insufficient permissions' })

        next()
    }
}

export const requireRead = requirePermission('read')
export const requireWrite = requirePermission('write')
export const requireDelete = requirePermission('delete')
export const requireAdmin = requirePermission('manage_members')
export const requireOwner = requirePermission('manage_org')
