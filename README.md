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

## Features
✅ User registration with email validation  
✅ **Real email delivery via Gmail SMTP**  
✅ **Beautiful HTML email templates**  
✅ Email verification required before login  
✅ Verification tokens expire in 24 hours  
✅ Password reset tokens expire in 1 hour  
✅ Password hashing with bcrypt  
✅ JWT authentication  
✅ Protected routes  
✅ Input validation  
✅ TypeORM entities with PostgreSQL  

## Development Commands

Build: `npm run build`  
Start dev: `npm run start:dev`  
Start prod: `npm run start:prod`  

## Email Setup

See **GMAIL_SETUP.md** for complete Gmail configuration instructions.

Emails include:
- ✉️ Welcome & Email Verification
- 🔒 Password Reset

All emails have professional HTML templates with fallback to plain text.

---

## Quick Start Commands

### Backend Server

**Development Mode:**
```bash
npm run start:dev
```

**Production Build:**
```bash
npm run build
npm run start:prod
```

### Frontend Application

**Start Frontend:**
```bash
cd client
npm start
```

**Build Frontend:**
```bash
cd client
npm run build
```

### Running Complete System

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
