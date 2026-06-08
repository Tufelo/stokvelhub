import Database from 'better-sqlite3';
import path from 'path';

// Create database file in backend folder
const dbPath = path.join(process.cwd(), 'stokvelhub.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stokvels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stokvels (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      description TEXT,
      founder_id TEXT NOT NULL,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Stokvel members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stokvel_members (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      stokvel_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
      UNIQUE(user_id, stokvel_id)
    )
  `);

  // Contributions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      stokvel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'PENDING',
      paid_at DATETIME,
      due_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Payouts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payouts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      stokvel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      cycle_number INTEGER NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stokvel_id) REFERENCES stokvels(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized with all tables');
}

// Helper functions
export function getDb() {
  return db;
}

// Close database (call this when app shuts down)
export function closeDatabase() {
  db.close();
  console.log('✅ Database connection closed');
}

// No auto-initialization here - let app.ts call it explicitly