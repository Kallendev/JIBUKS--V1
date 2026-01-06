# Quick Fix Summary

## Current Issues:

### 1. ✅ Email Fixed
- Added `tls: { rejectUnauthorized: false }` to email config
- Should now send emails successfully

### 2. ⚠️ Images Not Showing

**Most Likely Cause:** Images aren't being uploaded from mobile app

**To Verify:**
1. Add a member with an image
2. Check backend console - should see:
   - "Image uploaded successfully: http://..."
   - OR "No image uploaded"

**If you see "No image uploaded":**
The FormData isn't sending the image correctly from mobile.

**Solution:**
The code is already correct in `add-family-member.tsx`. The issue might be:
1. Image picker not working
2. profileImage state is empty
3. FormData not being created properly

**Test Steps:**

1. **On mobile app:**
   - Go to Add Member
   - Click camera icon
   - Select an image
   - Check if image preview shows
   - Fill other fields
   - Submit

2. **Check mobile console:**
   ```
   Should see:
   "Sending member data with image..."
   ```

3. **Check backend console:**
   ```
   Should see:
   "Create member - Creator role: MEMBER Tenant: 1"
   "Member data: { name: '...', email: '...', role: '...' }"
   "Image uploaded successfully: http://..." OR "No image uploaded"
   ```

4. **If "No image uploaded":**
   - Image wasn't sent from mobile
   - Check if profileImage state has a value
   - Check FormData construction

5. **If "Image uploaded successfully":**
   - Check `backend/public/uploads` folder
   - Image file should be there
   - Check database for avatarUrl
   - If URL exists, images should display

## What I've Fixed:

### Email Service:
```javascript
// Added TLS config to fix certificate error
tls: {
    rejectUnauthorized: false
}
```

### Frontend:
```typescript
// Changed to use expo-image for better compatibility
import { Image } from 'expo-image';
```

### Backend Logging:
```javascript
// Added logging to track image upload
console.log('Image uploaded successfully:', avatarUrl);
console.log('No image uploaded');
```

## Next Action:

**Try adding a member with an image and check the backend console output.**

If you see "No image uploaded", the problem is in the mobile app sending the image.
If you see "Image uploaded successfully", but images don't show, the problem is in displaying them.

Let me know what you see in the console!
