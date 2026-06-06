import express from 'express'
import orgController from '../../controllers/organizations'

const router = express.Router()

// Public: get invitation details by token (no auth needed — user may not have account yet)
router.get('/:token', orgController.getInvitationByToken)

// Accept invitation (must be authenticated)
router.post('/:token/accept', orgController.acceptInvitation)

export default router
