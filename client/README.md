# AHA-V2 Frontend

React TypeScript frontend for the AHA-V2 authentication system.

## Features

✅ **User Registration** - Beautiful signup form with validation
✅ **Email Verification** - Automatic verification via email links
✅ **Login System** - Secure JWT-based authentication
✅ **Protected Dashboard** - Accessible only to authenticated users
✅ **Password Reset** - Forgot password & reset functionality
✅ **Resend Verification** - Option to resend verification emails
✅ **Modern UI** - Gradient design with smooth animations
✅ **Responsive** - Works on desktop and mobile devices

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

## Pages

- **/** - Redirects to login
- **/login** - User login page
- **/register** - New user registration
- **/verify-email** - Email verification handler
- **/forgot-password** - Request password reset
- **/reset-password** - Reset password with token
- **/dashboard** - Protected user dashboard

## Usage Flow

1. **Register** a new account at `/register`
2. **Check your email** for verification link
3. **Click verification link** to verify your email
4. **Login** at `/login` with your credentials
5. **Access dashboard** to view your profile

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

## Development

The frontend runs on **port 3001** and proxies API requests to the backend on **port 3000**.

All authentication tokens are stored in localStorage and automatically included in API requests.

