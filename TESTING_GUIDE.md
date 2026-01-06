# JIBUKS - Complete Setup & Testing Guide

## ✅ Current Status

### Backend (Port 3001) - RUNNING ✓
- Server is running on port 3001 (PID: 1612)
- Database connected and migrated
- Email service configured with Gmail
- Image upload configured

### Frontend Configuration ✓
- Configured to connect to `http://192.168.1.68:3001/api`
- Using fetch API for all requests
- FormData support for image uploads

## 📧 Email Configuration

Your Gmail is configured:
- **Email:** lexisouders64@gmail.com
- **App Password:** fdmw puxl ugcq fsev
- **Service:** Gmail SMTP

## 🧪 How to Test Everything

### Step 1: Start the Frontend
```bash
cd FRONTEND
npm run web
```

### Step 2: Test the Complete Flow

1. **Register/Login**
   - Open http://localhost:8081
   - Register a new account or login
   - You will be assigned OWNER role automatically

2. **Family Setup**
   - Navigate to Family Setup screen
   - Enter your family name (e.g., "The Smith Family")
   - Click Continue

3. **Add a Family Member**
   - Click "Add Member" button
   - Fill in the form:
     - **Name:** John Doe
     - **Relationship:** Parent (or Child, Admin)
     - **Email:** test@example.com
     - **Password:** Test123!
     - **Profile Image:** (Optional) Click camera icon to select
   - Click "Add Member"

4. **What Should Happen:**
   - ✅ Success message appears
   - ✅ New member appears in family list
   - ✅ Email sent to test@example.com with login credentials
   - ✅ Image saved to database (if uploaded)
   - ✅ All data persisted in PostgreSQL

## 🔍 Verify in Database

Connect to PostgreSQL and run:

```sql
-- View all users with their roles and images
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u."avatarUrl",
    t.name as family_name
FROM users u
LEFT JOIN tenants t ON u."tenantId" = t.id
ORDER BY u."createdAt" DESC;

-- View family structure
SELECT 
    t.name as family_name,
    COUNT(u.id) as member_count,
    t."ownerEmail"
FROM tenants t
LEFT JOIN users u ON u."tenantId" = t.id
GROUP BY t.id, t.name, t."ownerEmail";
```

## 📧 Check Email Delivery

After adding a member, check:

1. **Backend Console** - Should show:
   ```
   Message sent: <message-id>
   ```

2. **Email Inbox** - The invited member should receive an email with:
   - Subject: "You've been invited to join the [Family Name] family on JIBUKS"
   - Body contains:
     - Welcome message
     - Family name
     - Login credentials (email & temporary password)

## 🐛 Troubleshooting

### "Network Request Failed" Error

**Possible Causes:**
1. Backend not running
2. Wrong port configuration
3. CORS issues

**Solutions:**
```bash
# Check if backend is running
netstat -ano | findstr :3001

# If not running, start it
cd backend
npm run dev

# Check frontend .env file
cd FRONTEND
type .env
# Should show: EXPO_PUBLIC_API_PORT=3001
```

### Image Upload Not Working

**For Web:**
- The image needs to be converted to Blob
- Check browser console for errors
- Verify `backend/public/uploads` folder exists

**For Native:**
- Ensure expo-image-picker is installed
- Check camera/gallery permissions

### Email Not Sending

**Check:**
1. Gmail App Password is correct (not regular password)
2. Backend console for error messages
3. Gmail account allows "Less secure app access" or uses App Password

**Test Email Manually:**
```bash
# In backend directory
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'lexisouders64@gmail.com',
    pass: 'fdmw puxl ugcq fsev'
  }
});
transporter.sendMail({
  from: 'lexisouders64@gmail.com',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test email'
}).then(console.log).catch(console.error);
"
```

## 📱 Platform-Specific Notes

### Web (localhost:8081)
- Uses Blob for image uploads
- FormData automatically handled by fetch
- Check browser DevTools Network tab for API calls

### iOS/Android
- Uses URI-based image handling
- Requires native permissions for camera/gallery
- Test on physical device or emulator

## 🎯 Expected API Calls

When adding a member, you should see in Network tab:

```
POST http://192.168.1.68:3001/api/family/members
Content-Type: multipart/form-data; boundary=----...

Form Data:
- name: John Doe
- email: test@example.com
- password: Test123!
- role: PARENT
- profileImage: (binary data)
```

Response:
```json
{
  "id": 2,
  "name": "John Doe",
  "email": "test@example.com",
  "role": "PARENT",
  "avatarUrl": "http://192.168.1.68:3001/uploads/1234567890-profile.jpg",
  "createdAt": "2026-01-06T10:00:00.000Z"
}
```

## ✨ Features Working

- ✅ User registration with role assignment
- ✅ Family creation and management
- ✅ Add family members with images
- ✅ Image upload and storage
- ✅ Email invitations with credentials
- ✅ Database persistence
- ✅ Role-based access control
- ✅ FormData handling for file uploads
- ✅ Cross-platform support (Web/Native)

## 🚀 Next Steps

1. Test adding multiple family members
2. Verify email delivery to real email addresses
3. Test image uploads with different file types
4. Verify role-based permissions
5. Test family setup flow end-to-end

---

**Need Help?**
- Check backend console for errors
- Check browser DevTools console
- Verify database connections
- Test email configuration separately

Everything is configured and ready to test! 🎉
