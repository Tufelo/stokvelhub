import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stokvelService, Stokvel } from '../services/stokvel.service';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Paper,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { motion } from 'framer-motion';

const StyledCard = styled(Card)({
  borderRadius: '16px',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
  },
});

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stokvels, setStokvels] = useState<Stokvel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newStokvel, setNewStokvel] = useState({ name: '', description: '', contributionAmount: 100 });

  useEffect(() => {
    loadStokvels();
  }, []);

  const loadStokvels = async () => {
    try {
      const data = await stokvelService.getAll();
      setStokvels(data);
    } catch (error) {
      console.error('Failed to load stokvels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await stokvelService.create(
        newStokvel.name,
        newStokvel.description,
        { contributionAmount: newStokvel.contributionAmount, contributionFrequency: 'monthly', maxMembers: 50 }
      );
      setOpen(false);
      setNewStokvel({ name: '', description: '', contributionAmount: 100 });
      loadStokvels();
    } catch (error) {
      console.error('Failed to create stokvel:', error);
    }
  };

  const handleClone = async (id: string) => {
    if (window.confirm('Clone this stokvel?')) {
      try {
        await stokvelService.clone(id);
        loadStokvels();
      } catch (error) {
        console.error('Failed to clone stokvel:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this stokvel? This cannot be undone.')) {
      try {
        await stokvelService.delete(id);
        loadStokvels();
      } catch (error) {
        console.error('Failed to delete stokvel:', error);
      }
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const navigateToStokvel = (id: string) => {
    window.location.href = `/stokvel/${id}`;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="static" elevation={0} sx={{ background: 'white', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#667eea' }}>
            StokvelHub
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              {user?.email}
            </Typography>
            <IconButton onClick={handleMenu} color="inherit">
              <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32 }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 4, px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
            My Stokvels
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              px: 3,
              py: 1,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b42a3 100%)',
              },
            }}
          >
            Create Stokvel
          </Button>
        </Box>

        {stokvels.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
            <Typography variant="h6" color="textSecondary">No stokvels yet</Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              Create your first stokvel to get started!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {stokvels.map((stokvel, index) => (
              <Grid item xs={12} md={6} lg={4} key={stokvel.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StyledCard>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                        {stokvel.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: '40px' }}>
                        {stokvel.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          label={`👥 ${stokvel.member_count} members`}
                          size="small"
                          sx={{ bgcolor: '#e8eaf6', color: '#667eea' }}
                        />
                        <Chip
                          label={`💰 R${stokvel.settings?.contributionAmount || 0}`}
                          size="small"
                          sx={{ bgcolor: '#f3e8ff', color: '#764ba2' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigateToStokvel(stokvel.id)}
                          sx={{ borderRadius: '8px', color: '#667eea', borderColor: '#667eea' }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => handleClone(stokvel.id)}
                          sx={{ borderRadius: '8px', color: '#764ba2', borderColor: '#764ba2' }}
                        >
                          Clone
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(stokvel.id)}
                          sx={{ borderRadius: '8px', color: '#e53e3e', borderColor: '#e53e3e' }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#333' }}>Create New Stokvel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Stokvel Name"
            fullWidth
            variant="outlined"
            value={newStokvel.name}
            onChange={(e) => setNewStokvel({ ...newStokvel, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newStokvel.description}
            onChange={(e) => setNewStokvel({ ...newStokvel, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Monthly Contribution (R)"
            type="number"
            fullWidth
            variant="outlined"
            value={newStokvel.contributionAmount}
            onChange={(e) => setNewStokvel({ ...newStokvel, contributionAmount: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b42a3 100%)',
              },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;