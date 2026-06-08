const Database = require('better-sqlite3');
const db = new Database('stokvelhub.db');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in database:');
console.log(tables);

// Get user count
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
console.log('\nUser count:', userCount.count);

// List all users
const users = db.prepare("SELECT id, email, role, created_at FROM users").all();
console.log('\nUsers:');
console.table(users);

db.close();
