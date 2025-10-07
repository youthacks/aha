const { DataSource } = require('typeorm');

// First connect to postgres database to check if aha exists
const PostgresDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres', // Connect to default postgres database
});

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'aha',
});

async function wipeDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    await PostgresDataSource.initialize();
    console.log('Connected successfully!');

    // Check if database exists
    const result = await PostgresDataSource.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_DATABASE || 'aha'}'`
    );

    if (result.length === 0) {
      console.log('\nDatabase does not exist. Creating it...');
      await PostgresDataSource.query(`CREATE DATABASE ${process.env.DB_DATABASE || 'aha'};`);
      console.log('✓ Database created successfully!');
      await PostgresDataSource.destroy();
      console.log('\n✅ Database is ready!');
      console.log('Next steps:');
      console.log('1. Start your NestJS application to create tables');
      process.exit(0);
    }

    // Close connection to postgres database
    await PostgresDataSource.destroy();

    // Now connect to the aha database to wipe it
    console.log('\nConnecting to aha database...');
    await AppDataSource.initialize();
    console.log('Connected successfully!');

    console.log('\n⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Dropping all tables...\n');

    // Drop all tables by dropping the schema and recreating it
    await AppDataSource.query(`DROP SCHEMA public CASCADE;`);
    console.log('✓ Dropped public schema');

    await AppDataSource.query(`CREATE SCHEMA public;`);
    console.log('✓ Recreated public schema');

    await AppDataSource.query(`GRANT ALL ON SCHEMA public TO postgres;`);
    await AppDataSource.query(`GRANT ALL ON SCHEMA public TO public;`);
    console.log('✓ Restored schema permissions');

    await AppDataSource.destroy();
    console.log('\n✅ Database wiped successfully!');
    console.log('All tables and data have been removed.');
    console.log('\nNext steps:');
    console.log('1. Restart your NestJS application to recreate tables');
    console.log('2. Or run migrations if you have them configured');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    console.error('\nPlease check the error message above and try again.');
    await PostgresDataSource.destroy().catch(() => {});
    await AppDataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

wipeDatabase();
