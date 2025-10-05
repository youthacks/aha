// Migration script to add email change and password change columns to users table
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Adding new columns for email and password change...');

    // Add new columns if they don't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "pendingEmail" VARCHAR,
      ADD COLUMN IF NOT EXISTS "emailChangeToken" VARCHAR,
      ADD COLUMN IF NOT EXISTS "emailChangeTokenExpiry" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "passwordChangeToken" VARCHAR,
      ADD COLUMN IF NOT EXISTS "passwordChangeTokenExpiry" TIMESTAMP;
    `);

    console.log('✅ Migration completed successfully!');
    console.log('New columns added:');
    console.log('  - pendingEmail');
    console.log('  - emailChangeToken');
    console.log('  - emailChangeTokenExpiry');
    console.log('  - passwordChangeToken');
    console.log('  - passwordChangeTokenExpiry');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

migrate()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
