const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'aha',
});

async function migrateAddYouthacks() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected successfully!');

    console.log('Adding column youthacksEnabled if not exists...');
    await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "youthacksEnabled" boolean DEFAULT false;`);
    console.log('✓ youthacksEnabled column ensured');

    console.log('Adding column youthacksId if not exists...');
    await AppDataSource.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "youthacksId" text;`);
    console.log('✓ youthacksId column ensured');

    await AppDataSource.destroy();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await AppDataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

migrateAddYouthacks();
