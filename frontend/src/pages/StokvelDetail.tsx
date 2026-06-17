import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stokvelService } from '../services/stokvel.service';
import {
  Box,
  Typography,
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
  LinearProgress,
  Grid,
  Select,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { motion } from 'framer-motion';

const StyledCard = styled(Card)({
  borderRadius: '16px',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
  },
});

const StokvelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stokvel, setStokvel] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [contributionDueDate, setContributionDueDate] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [nextRecipient, setNextRecipient] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const loadStokvel = useCallback(async () => {
    try {
      const data = await stokvelService.getById(id!);
      setStokvel(data);
    } catch (error) {
      console.error('Failed to load stokvel:', error);
    }
  }, [id]);

  const loadMembers = useCallback(async () => {
    try {
      const data = await stokvelService.getMembers(id!);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadContributions = useCallback(async () => {
    try {
      const data = await stokvelService.getContributions(id!);
      setContributions(data);
    } catch (error) {
      console.error('Failed to load contributions:', error);
    }
  }, [id]);

  const loadNextRecipient = useCallback(async () => {
    try {
      const data = await stokvelService.getNextRecipient(id!);
      setNextRecipient(data);
    } catch (error) {
      console.error('Failed to load next recipient:', error);
    }
  }, [id]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await stokvelService.getFinancialSummary(id!);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadStokvel();
      loadMembers();
      loadContributions();
      loadNextRecipient();
      loadSummary();
    }
  }, [id, loadStokvel, loadMembers, loadContributions, loadNextRecipient, loadSummary]);

  const handleAddMember = async () => {
    try {
      await stokvelService.addMember(id!, newMemberEmail, newMemberRole);
      setShowAddMember(false);
      setNewMemberEmail('');
      setNewMemberRole('MEMBER');
      loadMembers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Remove this member?')) {
      try {
        await stokvelService.removeMember(id!, memberId);
        loadMembers();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to remove member');
      }
    }
  };

  const handleAddContribution = async () => {
    if (!selectedMemberId) {
      alert('Please select a member');
      return;
    }
    try {
      await stokvelService.addContribution(id!, selectedMemberId, contributionAmount, contributionDueDate);
      setShowAddContribution(false);
      setContributionAmount(0);
      setContributionDueDate('');
      setSelectedMemberId('');
      loadContributions();
      loadSummary();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add contribution');
    }
  };

  const handleProcessPayout = async () => {
    if (window.confirm('Process payout for the next recipient?')) {
      try {
        await stokvelService.processPayout(id!);
        alert('Payout processed successfully!');
        loadNextRecipient();
        loadSummary();
        loadContributions();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to process payout');
      }
    }
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="static" elevation={0} sx={{ background: 'white', color: '#333', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton onClick={goBack} color="inherit">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#667eea', ml: 1 }}>
            {stokvel?.name || 'Stokvel Details'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 4, px: 2 }}>
        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Contributions</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#667eea">R{summary.total_contributions}</Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Payouts</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#764ba2">R{summary.total_payouts}</Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Balance</Typography>
                  <Typography variant="h5" fontWeight="bold" color={summary.balance >= 0 ? '#48bb78' : '#e53e3e'}>
                    R{summary.balance}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Members</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#667eea">{members.length}</Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        )}

        {/* Next Recipient */}
        {nextRecipient && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: '#f3e8ff', borderRadius: '12px' }}>
            <Typography variant="h6" fontWeight="600" color="#764ba2">🎯 Next Payout Recipient</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="body1" fontWeight="500">{nextRecipient.recipient?.email}</Typography>
              <Chip label={`Cycle ${nextRecipient.cycle_number}`} size="small" sx={{ bgcolor: '#667eea', color: 'white' }} />
              <Chip label={`R${nextRecipient.expected_payout}`} size="small" sx={{ bgcolor: '#764ba2', color: 'white' }} />
              <Button variant="contained" onClick={handleProcessPayout} sx={{ ml: 'auto' }}>
                Process Payout
              </Button>
            </Box>
          </Paper>
        )}

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, borderBottom: '2px solid #e0e0e0' }}>
          <Button
            onClick={() => setActiveTab('members')}
            sx={{
              py: 1.5,
              px: 3,
              color: activeTab === 'members' ? '#667eea' : '#666',
              borderBottom: activeTab === 'members' ? '2px solid #667eea' : 'none',
              borderRadius: 0,
              fontWeight: activeTab === 'members' ? 600 : 400,
            }}
          >
            Members ({members.length})
          </Button>
          <Button
            onClick={() => setActiveTab('contributions')}
            sx={{
              py: 1.5,
              px: 3,
              color: activeTab === 'contributions' ? '#667eea' : '#666',
              borderBottom: activeTab === 'contributions' ? '2px solid #667eea' : 'none',
              borderRadius: 0,
              fontWeight: activeTab === 'contributions' ? 600 : 400,
            }}
          >
            Contributions
          </Button>
        </Box>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="600">Members</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddMember(true)}>
                Add Member
              </Button>
            </Box>
            <Grid container spacing={2}>
              {members.map((member) => (
                <Grid item xs={12} sm={6} md={4} key={member.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">{member.email}</Typography>
                          <Chip
                            label={member.member_role}
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: member.member_role === 'FOUNDER' ? '#ffd700' : 
                                       member.member_role === 'ADMIN' ? '#667eea' : 
                                       member.member_role === 'TREASURER' ? '#48bb78' : '#e2e8f0',
                              color: member.member_role === 'FOUNDER' ? '#333' : 'white',
                            }}
                          />
                          <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                            Joined: {new Date(member.joined_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {member.member_role !== 'FOUNDER' && (
                          <IconButton size="small" color="error" onClick={() => handleRemoveMember(member.id)}>
                            <PersonRemoveIcon />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="600">Contributions</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddContribution(true)}>
                Record Contribution
              </Button>
            </Box>
            <Grid container spacing={2}>
              {contributions.map((contribution) => (
                <Grid item xs={12} key={contribution.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight="500">{contribution.member_email}</Typography>
                        <Chip
                          label={contribution.status}
                          size="small"
                          sx={{
                            bgcolor: contribution.status === 'PAID' ? '#48bb78' :
                                     contribution.status === 'PENDING' ? '#ed8936' : '#ecc94b',
                            color: 'white',
                          }}
                        />
                        <Typography variant="body2">Amount: <strong>R{contribution.amount}</strong></Typography>
                        <Typography variant="body2">Due: {new Date(contribution.due_date).toLocaleDateString()}</Typography>
                        {contribution.paid_at && (
                          <Typography variant="caption" color="textSecondary">
                            Paid: {new Date(contribution.paid_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Add Member Modal */}
      <Dialog open={showAddMember} onClose={() => setShowAddMember(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Member Email"
            type="email"
            fullWidth
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={newMemberRole}
              label="Role"
              onChange={(e) => setNewMemberRole(e.target.value)}
            >
              <MenuItem value="MEMBER">Member</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="TREASURER">Treasurer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAddMember(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add Contribution Modal */}
      <Dialog open={showAddContribution} onClose={() => setShowAddContribution(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Contribution</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Member</InputLabel>
            <Select
              value={selectedMemberId}
              label="Member"
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <MenuItem value="">Select Member</MenuItem>
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>{member.email}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Amount (R)"
            type="number"
            fullWidth
            value={contributionAmount}
            onChange={(e) => setContributionAmount(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            value={contributionDueDate}
            onChange={(e) => setContributionDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAddContribution(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddContribution}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StokvelDetail;