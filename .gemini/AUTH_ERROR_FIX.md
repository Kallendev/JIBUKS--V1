# 🔐 AUTHENTICATION ERROR - FIX GUIDE

## ❌ **ERROR:**
```
Missing or invalid authorization header
```

## 🔍 **WHAT THIS MEANS:**
The app is trying to access protected API endpoints without a valid authentication token.

---

## ✅ **QUICK FIX (Option 1): Re-Login**

### **Step 1: Clear App Data**
The easiest fix is to log out and log back in:

1. **On the app**, go to Profile/Settings
2. Click **"Logout"**
3. **Login again** with your credentials

This will generate a fresh authentication token.

---

## ✅ **QUICK FIX (Option 2): Clear AsyncStorage**

If you can't access the logout button, clear the storage manually:

### **Add this to your app temporarily:**

Create a file: `FRONTEND/utils/clearAuth.ts`
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAuth = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    console.log('✅ Auth cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth:', error);
  }
};
```

Then in your app (e.g., `app/index.tsx`), add:
```typescript
import { clearAuth } from '@/utils/clearAuth';

// Call this once
useEffect(() => {
  clearAuth();
}, []);
```

Then **restart the app** and **login again**.

---

## ✅ **QUICK FIX (Option 3): Check Backend Auth**

### **Verify the backend auth middleware:**

1. **Check if backend is running:**
```bash
curl http://192.168.1.70:4400/api/health
```

2. **Test login endpoint:**
```bash
curl -X POST http://192.168.1.70:4400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

If this returns a token, the backend is working fine.

---

## 🔧 **PERMANENT FIX: Better Error Handling**

Update `FRONTEND/services/api.ts` to handle auth errors better:

### **Add this to the ApiService class:**

```typescript
private async makeRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log('🔐 Token expired or invalid - clearing auth');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}
```

---

## 🎯 **RECOMMENDED SOLUTION**

### **For Now (Immediate Fix):**
1. **Restart the app**
2. **Go to Login screen**
3. **Login with your credentials**
4. **The token will be saved automatically**

### **For Production (Better UX):**
Add automatic token refresh logic:

```typescript
// In api.ts
private async refreshToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${this.baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  await AsyncStorage.setItem('authToken', data.accessToken);
  
  return data.accessToken;
}
```

---

## 📱 **TESTING CHECKLIST**

After fixing:

1. ✅ **Login works** - You can login successfully
2. ✅ **Token is saved** - Check AsyncStorage has `authToken`
3. ✅ **API calls work** - Accounts, Customers, etc. load
4. ✅ **No auth errors** - No more "Missing authorization header"

---

## 🚨 **COMMON CAUSES**

1. **App was reinstalled** - Clears AsyncStorage
2. **Token expired** - Default JWT expiry is 24 hours
3. **Backend restarted** - If using in-memory tokens
4. **Database was reset** - User no longer exists
5. **Wrong API URL** - Check `EXPO_PUBLIC_LOCAL_IP` in `.env`

---

## 💡 **QUICK DEBUG**

Add this to see what's in storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugAuth = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const user = await AsyncStorage.getItem('user');
  
  console.log('🔐 Auth Token:', token ? 'EXISTS' : 'MISSING');
  console.log('👤 User:', user ? JSON.parse(user) : 'MISSING');
};

// Call this in your app
debugAuth();
```

---

## ✅ **SOLUTION**

**The simplest fix right now:**

1. **Restart your app**
2. **Login again**
3. **Everything should work!**

The authentication system is working correctly - you just need a fresh token! 🚀
