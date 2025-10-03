# AHA-V2 Authentication System

## Tech Stack
- NestJS
- TypeScript
- Passport.js (JWT & Local strategies)
- PostgreSQL
- TypeORM
- REST API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure database in `.env` file

3. Start PostgreSQL and create database:
```sql
CREATE DATABASE aha_v2;
```

4. Run the application:
```bash
npm run start:dev
```

## API Endpoints

### Authentication

**POST /auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**GET /auth/profile** (Protected - requires JWT)
Headers: `Authorization: Bearer <token>`

## Features
- User registration with email validation
- Password hashing with bcrypt
- JWT authentication
- Protected routes
- Input validation
- TypeORM entities with PostgreSQL

## Development Commands

Build: `npm run build`
Start dev: `npm run start:dev`
Start prod: `npm run start:prod`
