import { OrgRole } from '../database/entities/OrganizationMember'

export interface RequestIdentity {
    userId: string
    orgId: string
    orgRole?: OrgRole
    authMethod: 'jwt' | 'apikey' | 'basic' | 'internal' | 'none'
}

declare global {
    namespace Express {
        interface Request {
            identity?: RequestIdentity
        }
    }
}
