import express from 'express'
import orgController from '../../controllers/organizations'
import { requireRead, requireWrite, requireAdmin, requireOwner } from '../../middlewares/rbac'
import { resolveOrgContext } from '../../middlewares/orgContext'

const router = express.Router()

// My orgs (no org context needed)
router.get('/', orgController.getMyOrganizations)
router.post('/', orgController.createOrganization)

// Single org (org context resolved from :orgId param)
router.get('/:orgId', resolveOrgContext, requireRead, orgController.getOrganization)

// Members
router.get('/:orgId/members', resolveOrgContext, requireRead, orgController.getMembers)
router.patch('/:orgId/members/:userId', resolveOrgContext, requireAdmin, orgController.updateMemberRole)
router.delete('/:orgId/members/:userId', resolveOrgContext, requireAdmin, orgController.removeMember)

// Invitations
router.get('/:orgId/invitations', resolveOrgContext, requireAdmin, orgController.listInvitations)
router.post('/:orgId/invitations', resolveOrgContext, requireAdmin, orgController.createInvitation)
router.delete('/:orgId/invitations/:invitationId', resolveOrgContext, requireAdmin, orgController.revokeInvitation)

export default router
