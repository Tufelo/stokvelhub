import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../db/user.repository';

export class AuthService {
  async register(email: string, password: string) {
    const existingUser = UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = UserRepository.create(email, hashedPassword, 'MEMBER');
    const safeUser = UserRepository.getSafeUser(user);

    // @ts-ignore - bypass TypeScript check for JWT options
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret_change_this',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return { user: safeUser, token };
  }

  async login(email: string, password: string) {
    const user = UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // @ts-ignore - bypass TypeScript check for JWT options
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret_change_this',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const safeUser = UserRepository.getSafeUser(user);
    return { user: safeUser, token };
  }
}