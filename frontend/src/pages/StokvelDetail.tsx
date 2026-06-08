import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stokvelService } from '../services/stokvel.service';
import "./Dashboard.css";

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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <button className="back-button" onClick={goBack}>
          ← Back
        </button>
        <h1>{stokvel?.name}</h1>
        <div className="placeholder"></div>
      </nav>

      <div className="dashboard-content">
        {summary && (
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Contributions</h3>
              <p>R{summary.total_contributions}</p>
            </div>
            <div className="summary-card">
              <h3>Total Payouts</h3>
              <p>R{summary.total_payouts}</p>
            </div>
            <div className="summary-card">
              <h3>Balance</h3>
              <p>R{summary.balance}</p>
            </div>
            <div className="summary-card">
              <h3>Members</h3>
              <p>{members.length}</p>
            </div>
          </div>
        )}

        {nextRecipient && (
          <div className="next-recipient">
            <h3>🎯 Next Payout Recipient</h3>
            <p><strong>{nextRecipient.recipient?.email}</strong></p>
            <p>Amount: R{nextRecipient.expected_payout} | Cycle: {nextRecipient.cycle_number}</p>
            <button className="btn-primary" onClick={handleProcessPayout}>
              Process Payout
            </button>
          </div>
        )}

        <div className="tabs">
          <button className={activeTab === 'members' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('members')}>
            Members ({members.length})
          </button>
          <button className={activeTab === 'contributions' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('contributions')}>
            Contributions
          </button>
        </div>

        {activeTab === 'members' && (
          <div>
            <div className="header">
              <h2>Members</h2>
              <button className="btn-primary" onClick={() => setShowAddMember(true)}>
                + Add Member
              </button>
            </div>
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="member-info">
                    <strong>{member.email}</strong>
                    <span className={`role-badge role-${member.member_role.toLowerCase()}`}>
                      {member.member_role}
                    </span>
                    <small>Joined: {new Date(member.joined_at).toLocaleDateString()}</small>
                  </div>
                  {member.member_role !== 'FOUNDER' && (
                    <button className="danger-small" onClick={() => handleRemoveMember(member.id)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div>
            <div className="header">
              <h2>Contributions</h2>
              <button className="btn-primary" onClick={() => setShowAddContribution(true)}>
                + Record Contribution
              </button>
            </div>
            <div className="contributions-list">
              {contributions.map((contribution) => (
                <div key={contribution.id} className="contribution-card">
                  <div className="contribution-info">
                    <strong>{contribution.member_email}</strong>
                    <span className={`status-badge status-${contribution.status.toLowerCase()}`}>
                      {contribution.status}
                    </span>
                    <span>Amount: R{contribution.amount}</span>
                    <small>Due: {new Date(contribution.due_date).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddMember && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Member</h3>
            <input
              type="email"
              placeholder="Member Email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <select title="Member Role" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="TREASURER">Treasurer</option>
            </select>
            <div className="modal-actions">
              <button onClick={handleAddMember}>Add</button>
              <button className="secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddContribution && (
        <div className="modal">
          <div className="modal-content">
            <h3>Record Contribution</h3>
            <select title="Select Member" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.email}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount (R)"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(Number(e.target.value))}
            />
            <input
              type="date"
              placeholder="Due Date"
              value={contributionDueDate}
              onChange={(e) => setContributionDueDate(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={handleAddContribution}>Record</button>
              <button className="secondary" onClick={() => setShowAddContribution(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokvelDetail;