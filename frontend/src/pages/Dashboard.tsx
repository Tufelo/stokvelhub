import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stokvelService, Stokvel } from '../services/stokvel.service';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stokvels, setStokvels] = useState<Stokvel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleCreateStokvel = async () => {
    try {
      await stokvelService.create(
        newStokvel.name,
        newStokvel.description,
        { contributionAmount: newStokvel.contributionAmount, contributionFrequency: 'monthly', maxMembers: 50 }
      );
      setShowCreateModal(false);
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

  const navigateToStokvel = (id: string) => {
    window.location.href = `/stokvel/${id}`;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>StokvelHub</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="header">
          <h2>My Stokvels</h2>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Stokvel
          </button>
        </div>

        <div className="stokvel-grid">
          {stokvels.map((stokvel) => (
            <div key={stokvel.id} className="stokvel-card">
              <h3>{stokvel.name}</h3>
              <p>{stokvel.description || 'No description'}</p>
              <div className="stokvel-stats">
                <span>👥 {stokvel.member_count} members</span>
                <span>💰 R{stokvel.settings?.contributionAmount || 0}/month</span>
              </div>
              <div className="stokvel-actions">
                <button onClick={() => navigateToStokvel(stokvel.id)}>View</button>
                <button onClick={() => handleClone(stokvel.id)}>Clone</button>
                <button className="danger" onClick={() => handleDelete(stokvel.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {stokvels.length === 0 && (
          <div className="empty-state">
            <p>No stokvels yet. Create your first one!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create Stokvel</h3>
            <input
              type="text"
              placeholder="Name"
              value={newStokvel.name}
              onChange={(e) => setNewStokvel({ ...newStokvel, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newStokvel.description}
              onChange={(e) => setNewStokvel({ ...newStokvel, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Monthly Contribution (R)"
              value={newStokvel.contributionAmount}
              onChange={(e) => setNewStokvel({ ...newStokvel, contributionAmount: Number(e.target.value) })}
            />
            <div className="modal-actions">
              <button onClick={handleCreateStokvel}>Create</button>
              <button className="secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;