# AHA Mobile - Token System Mobile App

React Native mobile application for both iOS and Android, built with Expo.

## Features

- 🔐 User Authentication (Login, Register, Email Verification, Password Reset)
- 📱 Event Management (Create, Join, Archive Events)
- 💰 Token System (View balance, Transactions)
- 🏪 Shop/Purchasables (Browse and purchase items)
- 👥 Member Management (View members, Update tokens - Admin/Manager only)
- 📊 Big Screen Mode (Live transaction feed)
- 🔄 Real-time updates (Auto-refresh every 3-5 seconds)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (installed automatically)
- For iOS: Mac with Xcode
- For Android: Android Studio with Android SDK

## Installation

1. Navigate to the mobile app directory:
```bash
cd mobile/AHAMobile
```

2. Install dependencies (already done):
```bash
npm install
```

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

This will open the Expo Developer Tools in your browser.

### Run on Android

Make sure you have Android Studio installed with an emulator, or connect a physical Android device with USB debugging enabled.

```bash
npm run android
```

Or scan the QR code from Expo Go app on your Android device.

### Run on iOS (Mac only)

Make sure you have Xcode installed with iOS simulator.

```bash
npm run ios
```

Or scan the QR code from Expo Go app on your iPhone.

### Run on Web

```bash
npm run web
```

## Configuration

### API URL

The app is configured to connect to `http://localhost:3000` by default.

To change the API URL, edit `src/services/api.ts`:

```typescript
const API_URL = 'http://your-api-url:3000';
```

**Note for Physical Devices:** When testing on a physical device, replace `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:3000`).

## Project Structure

```
src/
├── services/          # API services
│   ├── api.ts        # Authentication service & axios setup
│   └── events.service.ts  # Event management service
├── context/          # React Context
│   └── AuthContext.tsx    # Authentication context
├── navigation/       # Navigation setup
│   └── AppNavigator.tsx   # Stack navigator
├── screens/          # All app screens
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── EventDetailsScreen.tsx
│   ├── BigScreenModeScreen.tsx
│   ├── VerifyEmailScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   └── ResetPasswordScreen.tsx
├── components/       # Reusable components
└── types/           # TypeScript type definitions
```

## Key Dependencies

- **Expo**: Framework for React Native development
- **React Navigation**: Navigation library (Stack Navigator)
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local storage for authentication tokens
- **React Native Safe Area Context**: Handle safe areas on different devices
- **React Native Screens**: Native navigation primitives

## Features by Role

### All Users
- Login/Register with email verification
- View events they're part of
- View their token balance
- View event details and members
- Browse and purchase items from the shop
- View personal transaction history

### Managers & Admins
- Update member tokens
- Create new purchasables/stations
- View all event transactions

### Admins Only
- Archive/unarchive events
- Delete events
- Promote members to manager/admin

## Building for Production

### Android APK

```bash
expo build:android
```

### iOS IPA

```bash
expo build:ios
```

Follow Expo's documentation for detailed build instructions and app store submission.

## Troubleshooting

### Metro Bundler Issues

If you encounter bundler issues, try:
```bash
expo start -c
```

### Network Request Failed

Make sure:
1. Your backend server is running on `http://localhost:3000`
2. If testing on physical device, use your computer's IP address instead of localhost
3. Both devices are on the same network

### Android Emulator Connection

If Android emulator can't connect to localhost:
```bash
adb reverse tcp:3000 tcp:3000
```

## Testing with Expo Go

1. Install Expo Go app on your phone:
   - iOS: App Store
   - Android: Google Play Store

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## License

Same as parent project.

