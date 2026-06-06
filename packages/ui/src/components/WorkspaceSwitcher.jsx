import { useState } from 'react'
import {
    Box, Button, Popover, List, ListItemButton, ListItemText,
    ListItemIcon, Typography, Divider, Chip
} from '@mui/material'
import { IconChevronDown, IconPlus, IconBuilding } from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'

const ROLE_COLORS = { owner: 'error', admin: 'warning', editor: 'primary', viewer: 'default' }

const WorkspaceSwitcher = () => {
    const { currentOrg, organizations, switchOrg } = useAuth()
    const [anchor, setAnchor] = useState(null)

    if (!currentOrg) return null

    return (
        <>
            <Button
                onClick={(e) => setAnchor(e.currentTarget)}
                endIcon={<IconChevronDown size={16} />}
                sx={{ textTransform: 'none', justifyContent: 'space-between', width: '100%', px: 2, py: 1 }}
                variant='outlined'
                size='small'
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconBuilding size={16} />
                    <Typography variant='body2' fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                        {currentOrg.name}
                    </Typography>
                </Box>
            </Button>

            <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ width: 240, py: 1 }}>
                    <Typography variant='caption' color='text.secondary' sx={{ px: 2 }}>
                        YOUR WORKSPACES
                    </Typography>
                    <List dense>
                        {organizations.map((org) => (
                            <ListItemButton
                                key={org.id}
                                selected={org.id === currentOrg.id}
                                onClick={() => { switchOrg(org); setAnchor(null) }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <IconBuilding size={16} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Typography variant='body2' noWrap>{org.name}</Typography>}
                                    secondary={
                                        <Chip label={org.role} size='small' color={ROLE_COLORS[org.role] || 'default'} sx={{ height: 16, fontSize: 10 }} />
                                    }
                                />
                            </ListItemButton>
                        ))}
                    </List>
                    <Divider />
                    <ListItemButton onClick={() => setAnchor(null)}>
                        <ListItemIcon sx={{ minWidth: 32 }}><IconPlus size={16} /></ListItemIcon>
                        <ListItemText primary={<Typography variant='body2'>Create workspace</Typography>} />
                    </ListItemButton>
                </Box>
            </Popover>
        </>
    )
}

export default WorkspaceSwitcher
