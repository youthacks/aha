-- Quick script to wipe all data and reset the database
-- Run this in your PostgreSQL client or pgAdmin

-- Drop all tables in the correct order (respecting foreign keys)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS purchasables CASCADE;
DROP TABLE IF EXISTS event_members CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- The tables will be automatically recreated when you restart the NestJS backend
-- because synchronize: true is enabled in app.module.ts

