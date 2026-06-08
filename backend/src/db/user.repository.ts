import { getDb } from './database';

export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  // Create a new user
  static create(email: string, hashedPassword: string, role: string = 'MEMBER'): User {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO users (email, password, role)
      VALUES (?, ?, ?)
      RETURNING *
    `);
    return stmt.get(email, hashedPassword, role) as User;
  }

  // Find user by email
  static findByEmail(email: string): User | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  // Find user by ID
  static findById(id: string): User | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  // Get user without password
  static getSafeUser(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}