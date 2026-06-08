import api from './api';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};