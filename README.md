# AHA-V2 Authentication System

## Tech Stack
- NestJS
- TypeScript
- Passport.js (JWT & Local strategies)
- PostgreSQL
- TypeORM
- Nodemailer (Gmail SMTP)
- REST API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure database in `.env` file

3. **Configure Gmail SMTP** (See GMAIL_SETUP.md for detailed instructions):
   - Enable 2-Step Verification on your Google Account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Update `.env` file with your Gmail credentials:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=AHA-V2 <your-email@gmail.com>
   ```

4. Start PostgreSQL and create database:
```sql
CREATE DATABASE aha_v2;
```

5. Run the application:
```bash
npm run start:dev
```

## Database Management

### Wipe Database (Delete All Data)

If you need to reset the database and delete all data:

```bash
node wipe-db.js
```

This will drop all tables. When you restart the backend, TypeORM will automatically recreate them with the latest schema.

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

**GET /auth/verify-email?email=xxx&token=xxx** - Verify email (link sent via email)

**POST /auth/resend-verification**
```json
{
  "email": "user@example.com"
}
```

**POST /auth/forgot-password**
```json
{
  "email": "user@example.com"
}
```

**POST /auth/reset-password**
```json
{
  "email": "user@example.com",
  "token": "reset-token",
  "newPassword": "newPassword123"
}
```

**GET /auth/profile** (Protected - requires JWT)
Headers: `Authorization: Bearer <token>`

### Event System

Events use URL-friendly slugs based on the event name:
- Event names must be unique
- Event slugs are automatically generated (e.g., "My Awesome Event" → "my-awesome-event")
- Users join events using the slug instead of a random code


---


## Running Complete System

**Terminal 1 - Backend:**
```bash
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
   cd client
   npm start
```

Then open **http://localhost:3001** in your browser.
