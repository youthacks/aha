# AHA - Token System

Event management system with authentication and real-time tracking.

## Tech Stack

**Backend:**
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Passport.js (JWT)
- Nodemailer

**Frontend:**
- React 19
- TypeScript
- React Router v7
- Axios

## Quick Start

### 1. Install dependencies:
```bash
npm install
cd client ; npm install
```

### 2. Configure environment:
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=aha

JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=1d

NODE_ENV=development

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AHA <your-email@gmail.com>
APP_URL=http://localhost:3001
```

### 3. Create database:
```sql
CREATE DATABASE aha;
```

### 4. Start the application:
```bash
# Backend (runs on port 3000)
npm run start:dev

# Frontend (runs on port 3001)
cd client ; npm start
```

## Database Management

### Wipe Database
To reset the database and delete all data:
```bash
node wipe-db.js
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/verify-email` - Verify email
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/profile` - Get user profile (protected)

### Events
- `GET /events` - List all events
- `POST /events` - Create event
- `GET /events/:id` - Get event details
- `PATCH /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `POST /events/:id/join` - Join event
- `POST /events/:id/archive` - Archive event
- `POST /events/:id/unarchive` - Unarchive event

### Admin
- `POST /reset-database` - Reset entire database
- `GET /health` - Health check

## Project Structure

```
aha/
├── src/                      # Backend (NestJS)
│   ├── auth/                 # Authentication module
│   ├── users/                # User management
│   ├── events/               # Events & members
│   ├── email/                # Email service
│   └── main.ts               # App entry point
├── client/                   # Frontend (React)
│   └── src/
│       ├── pages/            # Page components
│       ├── components/       # Reusable components
│       ├── services/         # API services
│       └── context/          # React context
├── migrate-admin-to-owner.js # Database migration script
├── API_DOCUMENTATION.md      # Complete mobile API docs
└── README.md                 # This file
```
