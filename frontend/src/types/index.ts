export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Stokvel {
  id: string;
  name: string;
  description: string;
  member_count: number;
  founder_email: string;
  settings: {
    contributionAmount: number;
    contributionFrequency: string;
    maxMembers: number;
  };
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
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  due_date: string;
  paid_at: string;
  member_email: string;
}