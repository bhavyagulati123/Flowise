import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Alert, CircularProgress, Divider
} from '@mui/material'
import { useAuth } from '@/context/AuthContext'

const Register = () => {
    const navigate = useNavigate()
    const { register } = useAuth()
    const [form, setForm] = useState({ email: '', password: '', confirm: '', displayName: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirm) { setError('Passwords do not match'); return }
        setError('')
        setLoading(true)
        try {
            await register(form.email, form.password, form.displayName)
            navigate('/')
        } catch (err) {
            setError(err?.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
            <Card sx={{ width: 400, p: 2 }}>
                <CardContent>
                    <Typography variant='h5' fontWeight={700} mb={3} textAlign='center'>
                        Create your account
                    </Typography>

                    {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component='form' onSubmit={handleSubmit}>
                        <TextField label='Display Name' name='displayName' fullWidth value={form.displayName} onChange={handleChange} sx={{ mb: 2 }} />
                        <TextField label='Email' name='email' type='email' fullWidth required value={form.email} onChange={handleChange} sx={{ mb: 2 }} />
                        <TextField label='Password' name='password' type='password' fullWidth required value={form.password} onChange={handleChange} sx={{ mb: 2 }} />
                        <TextField label='Confirm Password' name='confirm' type='password' fullWidth required value={form.confirm} onChange={handleChange} sx={{ mb: 3 }} />
                        <Button type='submit' variant='contained' fullWidth size='large' disabled={loading}>
                            {loading ? <CircularProgress size={24} color='inherit' /> : 'Create Account'}
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography textAlign='center' variant='body2'>
                        Already have an account?{' '}
                        <Link to='/login' style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
                            Sign in
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    )
}

export default Register
