# MedFlow - Setup & Development Guide

## ✅ What Was Fixed

### Issue Identified
The application was showing incorrect/hardcoded user information across all portals (Admin, Patient, Super-Admin), causing confusion and making testing difficult.

### Fixes Applied

1. **Database Setup** (`db.json`)
   - ✅ Added complete doctor profiles with specialties, ratings, and clinic information
   - ✅ Created default test accounts for all three roles (Super Admin, Doctor, Patient)
   - ✅ Added sample appointments for testing

2. **UI Components**
   - ✅ **Sidebar.tsx**: Now displays actual logged-in user name instead of hardcoded values
   - ✅ **TopBar.tsx**: Replaced hardcoded "Jenkins Cardiology" with dynamic platform names
   - ✅ Both components now properly reflect the logged-in user's role and information

3. **Account Creation**
   - ✅ Default credentials document created for all three portals
   - ✅ Test data includes realistic clinic names, specialties, and ratings

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (uses demo config for development)

### Installation

```bash
# Install dependencies
npm install

# Create environment variables (if using real Firebase/Supabase)
cp .env.example .env.local

# For development with mock data, no .env setup needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Test Accounts

### Super Admin Portal
- **Email:** `admin@medflow.com`
- **Access URL:** http://localhost:3000/super-admin/dashboard
- **Capabilities:** View analytics, manage doctors, platform oversight

### Doctor Portal (Cardiology)
- **Email:** `dr.sarah@medflow.com`
- **Name:** Dr. Sarah Johnson
- **Specialty:** Cardiology
- **Access URL:** http://localhost:3000/admin/dashboard
- **Capabilities:** View appointments, manage schedule, patient communication

### Doctor Portal (General Practice)
- **Email:** `dr.john@medflow.com`
- **Name:** Dr. John Smith
- **Specialty:** General Practice
- **Access URL:** http://localhost:3000/admin/dashboard

### Patient Portal
- **Email:** `patient@example.com` (or any Gmail account for OAuth)
- **Access URL:** http://localhost:3000/auth/login → http://localhost:3000/client/dashboard
- **Capabilities:** Browse doctors, book appointments, view history

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/          # Doctor portal pages
│   ├── client/         # Patient portal pages
│   ├── super-admin/    # Platform admin pages
│   ├── auth/           # Authentication pages
│   └── api/            # API routes
├── components/
│   ├── layout/         # Shared layout components
│   ├── medflow/        # MedFlow-specific components
│   └── shared/         # Shared UI components
├── context/            # React context (Auth)
├── lib/
│   ├── firebase.ts     # Firebase config
│   ├── supabase.ts     # Supabase client
│   ├── supabase-mock.ts # Mock database
│   └── api-auth.ts     # API authentication
└── styles/             # Global styles
```

---

## 🗄️ Database Schema (Mock)

### Profiles Table
```json
{
  "id": "unique-user-id",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "patient|doctor|super_admin",
  "phone": "+1-555-0100"
}
```

### Doctor Profiles Table
```json
{
  "id": "doc-prof-001",
  "profile_id": "doctor-uid-001",
  "specialty": "Cardiology",
  "experience_years": 12,
  "consultation_fee": 150,
  "rating": 4.8,
  "is_verified": true,
  "clinic_name": "Heart Care Clinic"
}
```

### Appointments Table
```json
{
  "id": "appt-001",
  "patient_id": "patient-uid-001",
  "doctor_id": "doc-prof-001",
  "appointment_date": "2024-12-15",
  "appointment_time": "10:00",
  "status": "confirmed|pending|cancelled",
  "consultation_type": "video|in-person"
}
```

---

## 🔐 Authentication Flow

```
1. User visits /auth/login
2. Enters email/password or uses Google OAuth
3. Firebase authenticates user
4. AuthContext fetches user profile from API (/api/auth/me)
5. Profile created if first login (defaults to "patient" role)
6. User redirected to appropriate dashboard:
   - Doctor → /admin/dashboard
   - Patient → /client/dashboard
   - Super Admin → /super-admin/dashboard
```

---

## 🧪 Testing Each Portal

### Test Doctor Workflow
1. Login as `dr.sarah@medflow.com`
2. View daily appointments in dashboard
3. Check "Today" section for upcoming patients
4. Navigate to Calendar to view full schedule

### Test Patient Workflow
1. Login as `patient@example.com`
2. Browse available doctors
3. Book an appointment with Dr. Sarah
4. View appointment in dashboard

### Test Super Admin
1. Login as `admin@medflow.com`
2. View platform analytics
3. Check doctor management
4. Monitor system health

---

## 🔄 Mock Database

The app uses a mock database stored in `db.json` for development:

### Resetting Database
```bash
# Delete db.json to reset to defaults
rm db.json

# Restart server
npm run dev
```

The mock client automatically recreates `db.json` with default accounts on startup.

---

## 📝 Environment Variables

**For Development (with mock data):** No environment variables needed

**For Production (with real Supabase/Firebase):**

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=xxxxx  # Server-side only

# Server-side Auth
FIREBASE_ADMIN_SDK_KEY=xxxxx
```

---

## 🐛 Troubleshooting

### Issue: "Missing authorization" in API calls
**Solution:** Clear browser storage and re-login. AuthContext should automatically get fresh token.

### Issue: Doctor profile not showing
**Solution:** Ensure doctor has `is_verified: true` in db.json. Unverified doctors are filtered out.

### Issue: Appointments not loading
**Solution:** Check `db.json` has appointments with valid `patient_id` and `doctor_id` that match profile IDs.

### Issue: Users seeing wrong names in sidebar
**Solution:** This was the main issue fixed. If persisting, clear browser cache and restart dev server.

---

## 📚 Key Components

### AuthContext (`src/context/AuthContext.tsx`)
- Manages user authentication state
- Provides `useAuth()` hook
- Automatically redirects based on role

### API Routes
- `/api/auth/me` - Get current user profile
- `/api/doctors` - List verified doctors
- `/api/appointments` - Get user appointments
- `/api/doctor/schedule` - Get doctor's daily schedule

### Layout Components
- `Sidebar` - Navigation with user info
- `TopBar` - Breadcrumb and status
- Both now use actual user data instead of hardcoded values

---

## 🎯 Next Steps

1. **Test the three portals** with provided credentials
2. **Review the mock data** in `db.json`
3. **Customize** clinic names, doctor specialties as needed
4. **Connect to real Supabase** when ready for production
5. **Set up Firebase** authentication with real credentials

---

## ✨ Features

- ✅ Three-tier role system (Patient, Doctor, Super Admin)
- ✅ Appointment booking and management
- ✅ Doctor verification and ratings
- ✅ Real-time notifications support
- ✅ Video consultation ready
- ✅ Mock database for development
- ✅ Firebase & Supabase integration ready

---

## 📞 Support

For issues or questions, check:
- `DEFAULT_ACCOUNTS.md` - Test credentials
- `SETUP_GUIDE.md` - This file
- API route files for endpoint details
