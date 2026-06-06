import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET environment variable is not set')
    return secret
}

export const signAccessToken = (userId: string): string => {
    return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: '15m' })
}

export const verifyAccessToken = (token: string): { sub: string } => {
    return jwt.verify(token, getJwtSecret()) as { sub: string }
}

export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex')
}

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(32).toString('hex')
}

export const isJwtConfigured = (): boolean => {
    return !!process.env.JWT_SECRET
}
