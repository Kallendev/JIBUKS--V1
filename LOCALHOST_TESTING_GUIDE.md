# Localhost Testing Setup - Complete Guide

This guide explains how to test the React Native (Expo) frontend with the Node.js backend on Android emulator.

## ✅ Completed Setup

### 1. Backend CORS Configuration ✓
**File:** `/backend/src/app.js`

Updated CORS to accept connections from:
- `http://10.0.2.2:3000` - Android emulator accessing backend
- `http://10.0.2.2:8081` - Android emulator accessing Expo
- `exp://10.0.2.2:8081` - Expo development scheme
- Plus localhost variants for iOS/web testing

### 2. API Service ✓
**File:** `/FRONTEND/services/api.ts`

Created a comprehensive API service with:
- Platform-aware base URL (10.0.2.2 for Android, localhost for iOS/web)
- TypeScript interfaces for type safety
- Methods: login, register, getCurrentUser, refreshToken, logout
- Automatic token management with AsyncStorage
- Error handling

### 3. Authentication Context ✓
**File:** `/FRONTEND/contexts/AuthContext.tsx`

Created React Context for global auth state:
- User state management
- Token persistence with AsyncStorage
- Auto-load authentication on app start
- Login, register, logout functions
- Loading and error states
- useAuth() custom hook

### 4. Root Layout Update ✓
**File:** `/FRONTEND/app/_layout.tsx`

Wrapped app with AuthProvider to make authentication available throughout the app.

### 5. Signup Component Update ✓
**File:** `/FRONTEND/app/signup.tsx`

Updated signup to:
- Use useAuth() hook for registration
- Connect form inputs to API service
- Handle registration errors with alerts
- Show loading states during registration
- Navigate to main app on success

### 6. Dependencies ✓
Installed: `@react-native-async-storage/async-storage`

## 🚀 How to Test

### Step 1: Start Backend Server
```bash
cd backend
npm install  # if not done already
npm start    # or npm run dev
```

Backend should be running on `http://localhost:4000`

### Step 2: Start Android Emulator
Open Android Studio and launch an Android Virtual Device (AVD)

### Step 3: Start Expo Development Server
```bash
cd FRONTEND
npm install  # if not done already
npx expo start
```

### Step 4: Run on Android
Press `a` in the Expo terminal to open the app in Android emulator

## 🔍 Testing the Signup Flow

1. **Navigate to Signup**: App should show slideshow → auth → signup screens
2. **Fill the form**:
   - First Name: Test
   - Last Name: User
   - Phone: 0712345678
   - Email: test@example.com
   - Password: Test123!
   - Confirm Password: Test123!
3. **Click Continue**: 
   - Should see loading indicator
   - On success: Alert + navigation to main tabs
   - On error: Alert with error message

## 🐛 Troubleshooting

### Connection Refused
**Problem**: Cannot connect to backend from Android emulator

**Solutions**:
1. Verify backend is running: `curl http://localhost:4000/health`
2. From emulator, backend is at `10.0.2.2:4000` (not localhost)
3. Check backend terminal for CORS errors
4. Ensure firewall allows connections on port 4000

### CORS Errors
**Problem**: CORS policy blocking requests

**Solutions**:
1. Verify backend CORS config includes all emulator URLs
2. Check backend logs for blocked origins
3. Restart backend server after CORS changes

### Module Not Found Errors
**Problem**: Cannot find '@/contexts/AuthContext' or '@/services/api'

**Solutions**:
1. Verify tsconfig.json has path mappings
2. Restart Expo dev server: `Ctrl+C` then `npx expo start`
3. Clear Expo cache: `npx expo start -c`

### AsyncStorage Errors
**Problem**: AsyncStorage module not found

**Solution**:
```bash
cd FRONTEND
npm install @react-native-async-storage/async-storage
npx expo prebuild --clean
```

## 📱 Testing on Different Platforms

### iOS Simulator
Uses `http://localhost:4000/api` automatically (platform detection in api.ts)

### Physical Android Device (same network)
1. Find your computer's local IP: `ip addr show` or `ifconfig`
2. Update `api.ts` temporarily:
   ```typescript
   return 'http://YOUR_LOCAL_IP:4000/api';
   ```
3. Ensure device and computer are on same WiFi network

### Web
Uses `http://localhost:4000/api` automatically

## 🔐 Expected API Responses

### Successful Registration
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "phone": "0712345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Error Response
```json
{
  "message": "Email already exists",
  "errors": {
    "email": ["Email is already registered"]
  }
}
```

## 📝 Next Steps

To complete the full authentication flow:

1. **Update Login Component** (`app/login.tsx`):
   - Import useAuth hook
   - Connect login form to API
   - Handle login errors
   - Navigate on success

2. **Protect Routes**:
   - Add auth check in tab screens
   - Redirect to login if not authenticated
   - Show loading while checking auth

3. **Add Token Refresh**:
   - Implement refresh token logic
   - Handle token expiration
   - Auto-refresh on 401 errors

4. **Add Logout**:
   - Add logout button in app
   - Clear AsyncStorage on logout
   - Navigate to login screen

## 🌐 Special IP Addresses Explained

- `localhost` / `127.0.0.1`: Device's own loopback
- `10.0.2.2`: Android emulator's special alias for host machine's localhost
- `192.168.x.x`: Local network IP (for physical devices on same network)

## ✨ Features Implemented

✅ Platform-aware API base URL  
✅ Secure token storage with AsyncStorage  
✅ Global authentication state  
✅ Automatic token loading on app start  
✅ Type-safe API calls with TypeScript  
✅ Comprehensive error handling  
✅ Loading states for better UX  
✅ CORS configured for all development scenarios  

Happy testing! 🎉
