import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import authService from '../../services/auth'
import { verifyAccessToken } from '../../utils/jwt'

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}

const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, displayName } = req.body
        if (!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'email and password required' })

        const result = await authService.register(email, password, displayName)
        res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
        return res.status(StatusCodes.CREATED).json({
            user: result.user,
            accessToken: result.accessToken,
            orgId: result.orgId
        })
    } catch (error: any) {
        if (error.message === 'Email already registered') return res.status(StatusCodes.CONFLICT).json({ error: error.message })
        next(error)
    }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(StatusCodes.BAD_REQUEST).json({ error: 'email and password required' })

        const result = await authService.login(email, password)
        res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
        return res.json({ user: result.user, accessToken: result.accessToken })
    } catch (error: any) {
        if (error.message === 'Invalid credentials') return res.status(StatusCodes.UNAUTHORIZED).json({ error: error.message })
        next(error)
    }
}

const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken
        if (!rawToken) return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Refresh token required' })

        const result = await authService.refresh(rawToken)
        res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
        return res.json({ accessToken: result.accessToken })
    } catch (error: any) {
        res.clearCookie(REFRESH_COOKIE)
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid or expired refresh token' })
    }
}

const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rawToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken
        if (rawToken) await authService.logout(rawToken)
        res.clearCookie(REFRESH_COOKIE)
        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (error) {
        next(error)
    }
}

const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = (req.headers['authorization'] as string) || ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
        if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Not authenticated' })

        const payload = verifyAccessToken(token)
        const result = await authService.getMe(payload.sub)
        return res.json(result)
    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' })
    }
}

export default { register, login, refreshToken, logout, me }
