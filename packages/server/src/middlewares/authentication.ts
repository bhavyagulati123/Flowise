import { Request, Response, NextFunction } from 'express'
import { WHITELIST_URLS } from '../utils/constants'
import { verifyAccessToken, isJwtConfigured } from '../utils/jwt'
import { OrgRole } from '../database/entities/OrganizationMember'
import apikeyService from '../services/apikey'
import { compareKeys } from '../utils/apiKey'

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001'
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'

const URL_CASE_INSENSITIVE_REGEX = /\/api\/v1\//i
const URL_CASE_SENSITIVE_REGEX = /\/api\/v1\//

const parseBasicAuth = (header: string): { user: string; pass: string } | null => {
    if (!header.startsWith('Basic ')) return null
    try {
        const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
        const [user, ...rest] = decoded.split(':')
        return { user, pass: rest.join(':') }
    } catch {
        return null
    }
}

export const authenticationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only guard /api/v1/* paths
    if (!URL_CASE_INSENSITIVE_REGEX.test(req.path)) return next()

    // Case-sensitive check (reject /API/V1 etc.)
    if (!URL_CASE_SENSITIVE_REGEX.test(req.path)) {
        return res.status(401).json({ error: 'Unauthorized Access' })
    }

    // Whitelist — public endpoints (login, register, public chatbots, etc.)
    const isWhitelisted = WHITELIST_URLS.some((url) => req.path.startsWith(url))
    if (isWhitelisted) return next()

    // Internal UI canvas requests
    if (req.headers['x-request-from'] === 'internal') {
        ;(req as any).identity = { userId: SYSTEM_USER_ID, orgId: DEFAULT_ORG_ID, orgRole: OrgRole.OWNER, authMethod: 'internal' }
        return next()
    }

    const authHeader = ((req.headers['Authorization'] as string) ?? (req.headers['authorization'] as string)) || ''

    // Strategy 1: Bearer JWT (new enterprise path)
    if (authHeader.startsWith('Bearer ') && isJwtConfigured()) {
        const token = authHeader.slice(7)
        try {
            const payload = verifyAccessToken(token)
            const orgId = (req.headers['x-org-id'] as string) || DEFAULT_ORG_ID
            ;(req as any).identity = { userId: payload.sub, orgId, authMethod: 'jwt' }
            return next()
        } catch {
            // JWT invalid — fall through to try API key
        }
    }

    // Strategy 2: API Key as Bearer token (existing behavior, augmented with org context)
    if (authHeader.startsWith('Bearer ')) {
        const suppliedKey = authHeader.slice(7)
        try {
            const keys = await apikeyService.getAllApiKeys()
            const keyRecord = keys.find((k: any) => compareKeys(k.apiSecret, suppliedKey))
            if (keyRecord) {
                ;(req as any).identity = {
                    userId: keyRecord.createdByUserId || SYSTEM_USER_ID,
                    orgId: keyRecord.orgId || DEFAULT_ORG_ID,
                    orgRole: OrgRole.EDITOR,
                    authMethod: 'apikey'
                }
                return next()
            }
        } catch {
            // API key lookup failed — fall through
        }
        // Bearer token provided but not valid JWT or API key
        return res.status(401).json({ error: 'Unauthorized Access' })
    }

    // Strategy 3: Basic Auth (existing env-var behavior — preserved)
    if (process.env.FLOWISE_USERNAME && process.env.FLOWISE_PASSWORD) {
        const basic = parseBasicAuth(authHeader)
        if (basic && basic.user === process.env.FLOWISE_USERNAME && basic.pass === process.env.FLOWISE_PASSWORD) {
            ;(req as any).identity = { userId: SYSTEM_USER_ID, orgId: DEFAULT_ORG_ID, orgRole: OrgRole.OWNER, authMethod: 'basic' }
            return next()
        }
        return res.status(401).json({ error: 'Unauthorized Access' })
    }

    // Strategy 4: No auth configured — legacy open mode
    ;(req as any).identity = { userId: SYSTEM_USER_ID, orgId: DEFAULT_ORG_ID, orgRole: OrgRole.OWNER, authMethod: 'none' }
    next()
}
