# AHA-V2 Frontend

React TypeScript frontend for the AHA-V2 authentication system.


## Quick Start

### 1. Make sure the backend is running:
```bash
# In the main aha-v2 directory
npm run start:dev
```

### 2. Start the frontend:
```bash
# In the client directory
cd client
npm start
```

The app will open at **http://localhost:3001**

## Technologies

- React 19
- TypeScript
- React Router v7
- Axios
- Context API for state management
- CSS3 with gradients and animations

## Project Structure

```
client/src/
├── components/
│   └── PrivateRoute.tsx       # Protected route wrapper
├── context/
│   └── AuthContext.tsx        # Authentication state management
├── pages/
│   ├── Login.tsx              # Login page
│   ├── Register.tsx           # Registration page
│   ├── Dashboard.tsx          # User dashboard
│   ├── VerifyEmail.tsx        # Email verification page
│   ├── ForgotPassword.tsx     # Forgot password page
│   └── ResetPassword.tsx      # Reset password page
├── services/
│   └── api.ts                 # API service & axios configuration
├── App.tsx                    # Main app with routing
├── index.tsx                  # App entry point
└── index.css                  # Global styles
```

## Wipe Database
To reset the database, you can use the following command in the backend directory:

```bash
node wipe-db.js
```

## Development

The frontend runs on **port 3001** and proxies API requests to the backend on **port 3000**.

All authentication tokens are stored in localStorage and automatically included in API requests.

