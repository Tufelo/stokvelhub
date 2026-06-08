const Database = require('better-sqlite3');
const db = new Database('stokvelhub.db');

// Get user by email (change email as needed)
const email = process.argv[2] || 'test@example.com';
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

if (user) {
  console.log('User found:');
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Created: ${user.created_at}`);
  // Don't log password hash in production!
} else {
  console.log(`User with email ${email} not found`);
}

db.close();
