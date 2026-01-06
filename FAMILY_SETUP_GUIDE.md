# JIBUKS Family Setup - Complete Integration Guide

## ✅ What's Been Implemented

### Backend (Port 3001)
1. **Database Schema**
   - Added `Role` enum: OWNER, ADMIN, PARENT, CHILD, MEMBER
   - Users have `role` and `avatarUrl` fields
   - All data is stored in PostgreSQL database

2. **API Endpoints**
   - `GET /api/family` - Get family details and all members
   - `PUT /api/family` - Update family name
   - `POST /api/family/members` - Add new family member with image upload

3. **Image Upload**
   - Uses `multer` middleware
   - Images saved to `backend/public/uploads/`
   - Image URLs stored in database as `avatarUrl`
   - Accessible via `http://localhost:3001/uploads/filename.jpg`

4. **Email Invitations**
   - Uses `nodemailer` to send invitation emails
   - Sends temporary password to new members
   - Currently configured for Ethereal Email (test mode)
   - Check console for preview URLs

### Frontend
1. **Family Setup Screen** (`app/family-setup.tsx`)
   - Loads existing family members from database
   - Displays family name and members
   - Shows member roles and avatars
   - Updates family name in database

2. **Add Family Member Screen** (`app/add-family-member.tsx`)
   - Profile image picker (expo-image-picker)
   - Name, email, password, and relationship fields
   - Sends FormData with image to backend
   - Automatically maps relationship to role:
     - "parent" → PARENT
     - "child"/"kid" → CHILD
     - "admin" → ADMIN
     - default → MEMBER

3. **API Integration** (`services/api.ts`)
   - `getFamily()` - Fetch family data
   - `updateFamily(data)` - Update family name
   - `addFamilyMember(formData)` - Add member with image

## 🔄 How It Works

### Adding a Family Member Flow:
1. User fills form in Add Family Member screen
2. User selects profile image (optional)
3. On submit:
   - FormData is created with all fields
   - Image is attached as 'profileImage'
   - Sent to `POST /api/family/members`
4. Backend:
   - Validates user permissions (OWNER/ADMIN/PARENT only)
   - Saves image to disk
   - Hashes password
   - Creates user in database with avatarUrl
   - Sends invitation email with credentials
5. Frontend:
   - Shows success message
   - Redirects to Family Setup
   - Family Setup refreshes and shows new member

## 📝 Current Status

### ✅ Working:
- Backend server running on port 3001
- Database migrations applied
- Image upload configured
- Email service configured
- Frontend forms complete
- API integration complete

### ⚠️ To Configure:
1. **Email Settings** (Optional - currently using test mode)
   - Edit `backend/.env`
   - Add your SMTP credentials:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

2. **Test the App:**
   - Start backend: Already running on port 3001
   - Start frontend: `npm run web` in FRONTEND folder
   - Register/Login
   - Go to Family Setup
   - Add a family member with image
   - Check database for stored data
   - Check console for email preview URL

## 🗄️ Database Verification

To verify data is being stored, you can check:

```sql
-- View all users
SELECT id, name, email, role, "avatarUrl", "tenantId" FROM users;

-- View all families
SELECT id, name, slug, "ownerEmail" FROM tenants;

-- View family with members
SELECT t.name as family_name, u.name as member_name, u.role, u."avatarUrl"
FROM tenants t
LEFT JOIN users u ON u."tenantId" = t.id;
```

## 🎯 Next Steps

1. **Start the frontend:**
   ```bash
   cd FRONTEND
   npm run web
   ```

2. **Test the complete flow:**
   - Register a new account (becomes OWNER)
   - Set up family name
   - Add a family member with photo
   - Verify in database
   - Check email preview in console

3. **For production:**
   - Configure real SMTP server
   - Update CORS origins in backend
   - Set strong JWT_SECRET
   - Configure proper image storage (S3, etc.)

## 📧 Email Preview

When you add a member, check the backend console for:
```
Message sent: <message-id>
Preview URL: https://ethereal.email/message/...
```

Click the preview URL to see the invitation email!

## 🐛 Troubleshooting

**Port already in use:**
```bash
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

**Database connection issues:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env

**Image upload not working:**
- Check `backend/public/uploads` folder exists
- Verify multer middleware is attached to route

**Email not sending:**
- Check SMTP credentials in .env
- Look for errors in backend console
- Use Ethereal Email for testing (no config needed)

---

Everything is now set up and ready to use! 🎉
