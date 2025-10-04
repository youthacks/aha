# Quick Start Guide - AHA Mobile App

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Backend Server
Make sure your NestJS backend is running:
```bash
cd C:\Users\dyuan\Main\aha-v2
npm run start:dev
```

The backend should be running on `http://localhost:3000`

### Step 2: Configure API URL (if needed)
If testing on a physical device, you need to use your computer's IP address instead of localhost.

1. Find your local IP address:
   - Windows: Open Command Prompt and run `ipconfig`
   - Look for "IPv4 Address" (usually something like 192.168.1.XXX)

2. Edit `src/services/api.ts` and change:
   ```typescript
   const API_URL = 'http://192.168.1.XXX:3000';  // Replace XXX with your IP
   ```

### Step 3: Start the Mobile App
```bash
cd C:\Users\dyuan\Main\aha-v2\mobile\AHAMobile
npm start
```

## 📱 Running on Devices

### Option 1: Physical Device (Easiest)
1. Install "Expo Go" app from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the terminal
3. App will load on your device

### Option 2: Android Emulator
1. Install Android Studio
2. Create/start an Android emulator
3. Run: `npm run android`

### Option 3: iOS Simulator (Mac only)
1. Install Xcode
2. Run: `npm run ios`

### Option 4: Web Browser
```bash
npm run web
```

## 🎯 Test Account
Use the same accounts as your web app, or register a new one directly in the mobile app!

## 📝 Available Commands

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS (Mac only)
- `npm run web` - Run in web browser

## 🔧 Troubleshooting

**"Network request failed"**
- Make sure backend is running
- Check API_URL in `src/services/api.ts`
- For physical devices, use your computer's IP, not localhost

**"Unable to resolve module"**
- Run: `npm install`
- Clear cache: `npm start -- --clear`

**Android emulator can't connect to localhost**
- Run: `adb reverse tcp:3000 tcp:3000`

## 📚 Features Implemented

✅ Login & Registration
✅ Email Verification
✅ Password Reset
✅ Dashboard with Event List
✅ Create & Join Events
✅ Event Details (Members, Transactions, Shop)
✅ Token Management (Admin/Manager)
✅ Purchase Items
✅ Big Screen Mode
✅ Real-time Updates
✅ Archive Events
✅ Responsive UI for all screen sizes

Enjoy your AHA Token System mobile app! 🎉

