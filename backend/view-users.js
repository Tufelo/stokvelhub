const Database = require('better-sqlite3');
const db = new Database('stokvelhub.db');

// Get all users
const users = db.prepare('SELECT id, email, role, created_at FROM users').all();
console.log('Users in database:');
console.table(users);

// Get count
const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log(`\nTotal users: ${count.count}`);

db.close();