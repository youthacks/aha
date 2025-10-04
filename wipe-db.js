// Run this script to wipe the database: node wipe-db.js
const { Client } = require('pg');
require('dotenv').config();

async function wipeDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'aha_v2',
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Drop all tables in the correct order
    console.log('Dropping transactions table...');
    await client.query('DROP TABLE IF EXISTS transactions CASCADE');

    console.log('Dropping purchasables table...');
    await client.query('DROP TABLE IF EXISTS purchasables CASCADE');

    console.log('Dropping event_members table...');
    await client.query('DROP TABLE IF EXISTS event_members CASCADE');

    console.log('Dropping events table...');
    await client.query('DROP TABLE IF EXISTS events CASCADE');

    console.log('Dropping users table...');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('\n✅ Database wiped successfully!');
    console.log('All tables have been dropped.');
    console.log('\nNow restart your NestJS backend with: npm run start:dev');
    console.log('TypeORM will automatically recreate the tables with the new schema.\n');

  } catch (error) {
    console.error('❌ Error wiping database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

wipeDatabase();

