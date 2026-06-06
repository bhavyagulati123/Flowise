import { createContext, useContext, useState, useCallback, useRef } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [currentOrg, setCurrentOrg] = useState(null)
    const [orgRole, setOrgRole] = useState(null)
    const [organizations, setOrganizations] = useState([])
    const accessTokenRef = useRef(null)

    const setToken = (token) => {
        accessTokenRef.current = token
    }

    const getToken = () => accessTokenRef.current

    const login = useCallback(async (email, password) => {
        const res = await axios.post('/api/v1/auth/login', { email, password }, { withCredentials: true })
        accessTokenRef.current = res.data.accessToken
        setUser(res.data.user)
        await loadOrganizations()
        return res.data
    }, [])

    const register = useCallback(async (email, password, displayName) => {
        const res = await axios.post('/api/v1/auth/register', { email, password, displayName }, { withCredentials: true })
        accessTokenRef.current = res.data.accessToken
        setUser(res.data.user)
        await loadOrganizations(res.data.orgId)
        return res.data
    }, [])

    const logout = useCallback(async () => {
        try { await axios.post('/api/v1/auth/logout', {}, { withCredentials: true }) } catch {}
        accessTokenRef.current = null
        setUser(null)
        setCurrentOrg(null)
        setOrganizations([])
    }, [])

    const refreshToken = useCallback(async () => {
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        accessTokenRef.current = res.data.accessToken
        return res.data.accessToken
    }, [])

    const loadOrganizations = useCallback(async (defaultOrgId) => {
        try {
            const res = await axios.get('/api/v1/organizations', {
                headers: { Authorization: `Bearer ${accessTokenRef.current}` }
            })
            setOrganizations(res.data)
            if (res.data.length > 0) {
                const org = defaultOrgId ? res.data.find(o => o.id === defaultOrgId) || res.data[0] : res.data[0]
                setCurrentOrg(org)
                setOrgRole(org.role)
            }
        } catch {}
    }, [])

    const switchOrg = useCallback((org) => {
        setCurrentOrg(org)
        setOrgRole(org.role)
    }, [])

    const isAuthenticated = !!user

    return (
        <AuthContext.Provider value={{
            user, currentOrg, orgRole, organizations,
            isAuthenticated, getToken, setToken,
            login, register, logout, refreshToken, switchOrg, loadOrganizations
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
