# Image Not Showing - Debug Steps

## Check These Things:

### 1. Check Mobile App Console
Look for this log message:
```
🏠 Family API response: { ... }
```

**What to look for:**
- Find the `users` array
- Check if `avatarUrl` field exists
- Check if it has a value like: `"http://192.168.1.68:3001/uploads/..."`

### 2. If avatarUrl is NULL or missing:

**Problem:** Image wasn't saved to database

**Solution:**
Check backend console when you added the member. Should see:
```
Image uploaded successfully: http://...
```

If you see "No image uploaded", the image didn't come from mobile app.

### 3. If avatarUrl EXISTS but image doesn't show:

**Test the URL:**
1. Copy the avatarUrl from the console
2. Open it in your mobile browser
3. If image loads in browser but not in app, it's a display issue

**Possible fixes:**

A. **Try using React Native Image instead of expo-image:**

In `family-setup.tsx`, change line 3 from:
```typescript
import { Image } from 'expo-image';
```

To:
```typescript
import { Image } from 'react-native';
```

And remove the `contentFit` prop from the Image component.

B. **Check if the condition is working:**

The code checks `if (member.avatar)` - maybe avatar is an empty string `""` instead of null.

Change line 148 to:
```typescript
{member.avatar && member.avatar.length > 0 ? (
```

### 4. Quick Fix to Test:

Replace the entire avatar rendering section (lines 147-161) with this:

```typescript
<View style={styles.avatarContainer}>
  {member.avatar && member.avatar.length > 0 ? (
    <Image 
      source={{ uri: member.avatar }} 
      style={styles.avatar}
      resizeMode="cover"
    />
  ) : (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarText}>
        {member.name.charAt(0).toUpperCase()}
      </Text>
    </View>
  )}
  <Text style={{ fontSize: 10, color: 'red' }}>
    {member.avatar ? 'HAS' : 'NO'} AVATAR
  </Text>
</View>
```

This will show "HAS AVATAR" or "NO AVATAR" below each member so you can see if the data is there.

### 5. Check Database Directly:

Run this SQL query:
```sql
SELECT id, name, email, "avatarUrl" FROM users ORDER BY id DESC LIMIT 5;
```

You should see the avatarUrl column populated with URLs like:
```
http://192.168.1.68:3001/uploads/1736163000000-profile.jpg
```

### 6. Most Common Issues:

1. **avatarUrl is null** → Image wasn't uploaded
2. **avatarUrl is empty string** → Need to check for `length > 0`
3. **avatarUrl exists but wrong format** → Check if it starts with `http://`
4. **Image component not loading** → Try React Native Image instead of expo-image
5. **CORS issue** → Image URL blocked by CORS (check backend CORS settings)

---

## Quick Test:

1. Check mobile console for the API response log
2. Look at the avatarUrl value
3. Copy that URL and paste it in your mobile browser
4. If it loads in browser, the problem is the Image component
5. If it doesn't load in browser, the problem is the URL or backend

**Tell me what you see in the console and I'll help you fix it!**
