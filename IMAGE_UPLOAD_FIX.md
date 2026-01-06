# Image Upload Fix Guide

## Issue: Images Not Showing

### Problem:
- Images are uploaded but not displaying
- Only seeing initials in circles
- `avatarUrl` might be null or incorrect

### Diagnosis Steps:

1. **Check if images are being uploaded:**
```bash
cd backend
dir public\uploads
# Should see image files if upload is working
```

2. **Check database for avatarUrl:**
```sql
SELECT id, name, email, "avatarUrl" FROM users;
# Should see URLs like: http://192.168.1.68:3001/uploads/filename.jpg
```

3. **Check backend console when adding member:**
```
Should see:
- "Image uploaded successfully: http://..."
OR
- "No image uploaded"
```

4. **Check frontend console:**
```
Should see:
- "Loaded family members with avatars: [...]"
- "Rendering avatar for [name]: http://..."
```

### Common Issues & Fixes:

#### Issue 1: Images Not Being Uploaded
**Symptom:** `public/uploads` folder is empty

**Fix:**
1. Verify FormData is being sent correctly
2. Check multer middleware is attached to route
3. Verify `public/uploads` folder exists

```javascript
// backend/src/routes/family.js
router.post('/members', upload.single('profileImage'), createMember);
```

#### Issue 2: avatarUrl is null in database
**Symptom:** Database shows `avatarUrl: null`

**Cause:** Image not being sent from mobile app

**Fix in mobile app:**
```typescript
// Make sure profileImage state has a value
if (profileImage) {
  const filename = profileImage.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('profileImage', {
    uri: profileImage,
    name: filename,
    type: type,
  });
}
```

#### Issue 3: Image URL is correct but not displaying
**Symptom:** avatarUrl exists but image doesn't show

**Possible causes:**
1. CORS issue
2. Image URL not accessible
3. React Native Image component issue

**Fixes:**

1. **Use expo-image instead of react-native Image:**
```typescript
import { Image } from 'expo-image';

<Image 
  source={{ uri: member.avatar }} 
  style={styles.avatar}
  contentFit="cover"
/>
```

2. **Verify image URL is accessible:**
- Open browser: `http://192.168.1.68:3001/uploads/filename.jpg`
- Should display the image

3. **Check CORS in backend:**
```javascript
// backend/src/app.js
app.use(cors({
  origin: buildCorsOrigins(),
  credentials: true
}));
```

### Quick Test:

1. **Add a member with image**
2. **Check backend console:**
```
Create member - Creator role: MEMBER Tenant: 1
Member data: { name: 'John', email: 'john@test.com', role: 'CHILD' }
Image uploaded successfully: http://192.168.1.68:3001/uploads/1736163000000-profile.jpg
```

3. **Check frontend console:**
```
Loaded family members with avatars: [{
  id: '2',
  name: 'John',
  avatar: 'http://192.168.1.68:3001/uploads/1736163000000-profile.jpg'
}]
Rendering avatar for John: http://192.168.1.68:3001/uploads/1736163000000-profile.jpg
```

4. **Verify in database:**
```sql
SELECT "avatarUrl" FROM users WHERE email = 'john@test.com';
-- Should return: http://192.168.1.68:3001/uploads/1736163000000-profile.jpg
```

### Current Status:

✅ Backend configured for image upload
✅ Multer middleware setup
✅ Upload route configured
✅ Database field ready
✅ Frontend FormData setup
✅ expo-image imported

### Next Steps:

1. Add a new member with an image
2. Check all console logs
3. Verify image file exists in `backend/public/uploads`
4. Check database for avatarUrl
5. If URL exists, test it in browser
6. Check mobile app console for any errors

### Debugging Commands:

```bash
# Backend - Check uploads folder
cd backend
dir public\uploads

# Backend - Check if server is serving images
# Open browser: http://192.168.1.68:3001/uploads/

# Database - Check avatarUrl values
# In PostgreSQL:
SELECT id, name, "avatarUrl" FROM users WHERE "avatarUrl" IS NOT NULL;
```

### Expected Flow:

```
Mobile App
  ↓
Select image from gallery
  ↓
Create FormData with image
  ↓
POST to /api/family/members
  ↓
Backend receives multipart/form-data
  ↓
Multer saves to public/uploads/
  ↓
avatarUrl = http://192.168.1.68:3001/uploads/filename.jpg
  ↓
Save to database
  ↓
Return user with avatarUrl
  ↓
Frontend receives response
  ↓
Load family members
  ↓
Display image using expo-image
```

---

If images still don't show, check the console logs to see where in this flow it's failing.
