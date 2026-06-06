import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import orgService from '../../services/organizations'
import invitationService from '../../services/invitations'
import { OrgRole } from '../../database/entities/OrganizationMember'

const getMyOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const identity = (req as any).identity
        const orgs = await orgService.getOrganizations(identity.userId)
        return res.json(orgs)
    } catch (error) {
        next(error)
    }
}

const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const identity = (req as any).identity
        const { name, type } = req.body
        if (!name) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'name is required' })
        const org = await orgService.createOrganization(identity.userId, name, type)
        return res.status(StatusCodes.CREATED).json(org)
    } catch (error) {
        next(error)
    }
}

const getOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const org = await orgService.getOrganization(req.params.orgId)
        if (!org) return res.status(StatusCodes.NOT_FOUND).json({ error: 'Organization not found' })
        return res.json(org)
    } catch (error) {
        next(error)
    }
}

const getMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await orgService.getMembers(req.params.orgId)
        return res.json(members)
    } catch (error) {
        next(error)
    }
}

const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const identity = (req as any).identity
        const { role } = req.body
        if (!role || !Object.values(OrgRole).includes(role)) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Valid role is required' })
        }
        const result = await orgService.updateMemberRole(req.params.orgId, req.params.userId, role as OrgRole, identity.orgRole)
        return res.json(result)
    } catch (error: any) {
        if (error.message?.includes('OWNER') || error.message?.includes('last owner')) {
            return res.status(StatusCodes.FORBIDDEN).json({ error: error.message })
        }
        next(error)
    }
}

const removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await orgService.removeMember(req.params.orgId, req.params.userId)
        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (error: any) {
        if (error.message?.includes('last owner') || error.message?.includes('not found')) {
            return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message })
        }
        next(error)
    }
}

const createInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const identity = (req as any).identity
        const { email, role } = req.body
        if (!email || !role) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'email and role are required' })
        const invite = await invitationService.createInvitation(req.params.orgId, identity.userId, email, role as OrgRole)
        return res.status(StatusCodes.CREATED).json(invite)
    } catch (error: any) {
        if (error.message?.includes('already a member')) return res.status(StatusCodes.CONFLICT).json({ error: error.message })
        next(error)
    }
}

const listInvitations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invites = await invitationService.listInvitations(req.params.orgId)
        return res.json(invites)
    } catch (error) {
        next(error)
    }
}

const revokeInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await invitationService.revokeInvitation(req.params.orgId, req.params.invitationId)
        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (error) {
        next(error)
    }
}

const getInvitationByToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invite = await invitationService.getInvitationByToken(req.params.token)
        return res.json(invite)
    } catch (error: any) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: error.message })
    }
}

const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const identity = (req as any).identity
        const result = await invitationService.acceptInvitation(req.params.token, identity.userId)
        return res.json(result)
    } catch (error: any) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message })
    }
}

export default {
    getMyOrganizations, createOrganization, getOrganization,
    getMembers, updateMemberRole, removeMember,
    createInvitation, listInvitations, revokeInvitation,
    getInvitationByToken, acceptInvitation
}
