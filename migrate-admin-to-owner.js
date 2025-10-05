const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'aha',
});

async function migrateAdminToOwner() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected successfully!');

    console.log('Adding owner to enum type...');
    try {
      await AppDataSource.query(
        `ALTER TYPE event_members_role_enum ADD VALUE IF NOT EXISTS 'owner'`
      );
      console.log('✓ Added owner to enum type');
    } catch (err) {
      console.log('Note: owner value might already exist in enum');
    }

    console.log('Updating admin roles to owner in data...');
    const updateResult = await AppDataSource.query(
      `UPDATE event_members SET role = 'owner' WHERE role = 'admin'`
    );
    console.log(`✓ Updated ${updateResult[1]} record(s) from 'admin' to 'owner'`);

    console.log('Removing admin from enum type...');

    await AppDataSource.query(`
      ALTER TABLE event_members ALTER COLUMN role DROP DEFAULT;
    `);
    console.log('✓ Dropped default constraint');

    await AppDataSource.query(`
      CREATE TYPE event_members_role_enum_new AS ENUM ('member', 'manager', 'owner');
      
      ALTER TABLE event_members 
        ALTER COLUMN role TYPE event_members_role_enum_new 
        USING role::text::event_members_role_enum_new;
      
      DROP TYPE event_members_role_enum;
      
      ALTER TYPE event_members_role_enum_new RENAME TO event_members_role_enum;
    `);
    console.log('✓ Enum type updated successfully');

    await AppDataSource.query(`
      ALTER TABLE event_members ALTER COLUMN role SET DEFAULT 'member'::event_members_role_enum;
    `);
    console.log('✓ Restored default constraint');

    await AppDataSource.destroy();
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now restart your NestJS application.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease check the error message above and try again.');
    await AppDataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

migrateAdminToOwner();
