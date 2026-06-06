import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress, Divider
} from '@mui/material'
import { useAuth } from '@/context/AuthContext'

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError(err?.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
            <Card sx={{ width: 400, p: 2 }}>
                <CardContent>
                    <Typography variant='h5' fontWeight={700} mb={3} textAlign='center'>
                        Sign in to Flowise
                    </Typography>

                    {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component='form' onSubmit={handleSubmit}>
                        <TextField
                            label='Email'
                            type='email'
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label='Password'
                            type='password'
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button type='submit' variant='contained' fullWidth size='large' disabled={loading}>
                            {loading ? <CircularProgress size={24} color='inherit' /> : 'Sign In'}
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography textAlign='center' variant='body2'>
                        Don&apos;t have an account?{' '}
                        <Link to='/register' style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                            Register
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    )
}

export default Login
