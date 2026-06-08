import api from './api';

export interface Stokvel {
  id: string;
  name: string;
  description: string;
  member_count: number;
  founder_email: string;
  settings: any;
  created_at: string;
}

export interface Member {
  id: string;
  email: string;
  member_role: string;
  joined_at: string;
}

export interface Contribution {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string;
  member_email: string;
}

export const stokvelService = {
  // Stokvel CRUD
  async getAll(): Promise<Stokvel[]> {
    const response = await api.get('/stokvels');
    return response.data.data;
  },

  async getById(id: string): Promise<any> {
    const response = await api.get(`/stokvels/${id}`);
    return response.data.data;
  },

  async create(name: string, description: string, settings: any): Promise<Stokvel> {
    const response = await api.post('/stokvels', { name, description, settings });
    return response.data.data;
  },

  async clone(id: string): Promise<Stokvel> {
    const response = await api.post(`/stokvels/${id}/clone`);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/stokvels/${id}`);
  },

  // Members
  async getMembers(stokvelId: string): Promise<Member[]> {
    const response = await api.get(`/stokvels/${stokvelId}/members`);
    return response.data.data;
  },

  async addMember(stokvelId: string, email: string, role: string): Promise<any> {
    const response = await api.post(`/stokvels/${stokvelId}/members`, { email, role });
    return response.data.data;
  },

  async removeMember(stokvelId: string, memberId: string): Promise<void> {
    await api.delete(`/stokvels/${stokvelId}/members/${memberId}`);
  },

  // Contributions
  async addContribution(stokvelId: string, memberId: string, amount: number, dueDate: string): Promise<any> {
    const response = await api.post(`/stokvels/${stokvelId}/contributions`, { memberId, amount, dueDate });
    return response.data.data;
  },

  async getContributions(stokvelId: string): Promise<Contribution[]> {
    const response = await api.get(`/stokvels/${stokvelId}/contributions`);
    return response.data.data;
  },

  // Payouts
  async getNextRecipient(stokvelId: string): Promise<any> {
    const response = await api.get(`/stokvels/${stokvelId}/payouts/next`);
    return response.data.data;
  },

  async processPayout(stokvelId: string): Promise<any> {
    const response = await api.post(`/stokvels/${stokvelId}/payouts/process`);
    return response.data.data;
  },

  async getPayoutHistory(stokvelId: string): Promise<any[]> {
    const response = await api.get(`/stokvels/${stokvelId}/payouts/history`);
    return response.data.data;
  },

  async getFinancialSummary(stokvelId: string): Promise<any> {
    const response = await api.get(`/stokvels/${stokvelId}/payouts/summary`);
    return response.data.data;
  },
};