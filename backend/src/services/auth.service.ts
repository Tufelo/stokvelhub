import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../db/user.repository';

export class AuthService {
  async register(email: string, password: string) {
    // Check if user exists
    const existingUser = UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = UserRepository.create(email, hashedPassword, 'MEMBER');
    const safeUser = UserRepository.getSafeUser(user);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret_change_this',
      { expiresIn: '7d' } as jwt.SignOptions
    );

    return { user: safeUser, token };
  }

  async login(email: string, password: string) {
    // Find user
    const user = UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret_change_this',
      { expiresIn: '7d' } as jwt.SignOptions
    );

    const safeUser = UserRepository.getSafeUser(user);
    return { user: safeUser, token };
  }
}