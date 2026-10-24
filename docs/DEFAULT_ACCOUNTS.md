# MedFlow - Default Test Accounts

This document provides the default test accounts for development and testing across all portals.

## Account Types & Access

### 1. Super Admin Portal
**Access:** `/super-admin/login` → `/super-admin/dashboard`

| Field | Value |
|-------|-------|
| Email | `admin@medflow.com` |
| Full Name | MedFlow Admin |
| User ID | super-admin-uid-001 |
| Role | super_admin |
| Phone | +1-555-0100 |

**Capabilities:**
- View platform-wide analytics
- Manage doctors and verify profiles
- Monitor system statistics
- Access compliance and reporting features

---

### 2. Doctor Portal
**Access:** `/admin/login` → `/admin/dashboard`

#### Doctor 1: Dr. Sarah Johnson (Cardiology)
| Field | Value |
|-------|-------|
| Email | `dr.sarah@medflow.com` |
| Full Name | Dr. Sarah Johnson |
| User ID | doctor-uid-001 |
| Specialty | Cardiology |
| Experience | 12 years |
| Consultation Fee | $150 |
| Rating | 4.8★ (45 reviews) |
| Clinic | Heart Care Clinic |
| Languages | English, Spanish |

#### Doctor 2: Dr. John Smith (General Practice)
| Field | Value |
|-------|-------|
| Email | `dr.john@medflow.com` |
| Full Name | Dr. John Smith |
| User ID | doctor-uid-002 |
| Specialty | General Practice |
| Experience | 8 years |
| Consultation Fee | $100 |
| Rating | 4.6★ (32 reviews) |
| Clinic | Primary Health Center |
| Languages | English, French |

**Capabilities:**
- View daily appointments
- Manage schedule
- Communicate with patients
- Access appointment history
- View patient reviews

---

### 3. Patient Portal
**Access:** `/auth/login` → `/client/dashboard`

#### Patient 1: John Doe
| Field | Value |
|-------|-------|
| Email | `patient@example.com` |
| Full Name | John Doe |
| User ID | patient-uid-001 |
| Phone | +1-555-0201 |

#### Patient 2: Jane Wilson
| Field | Value |
|-------|-------|
| Email | `jane@example.com` |
| Full Name | Jane Wilson |
| User ID | patient-uid-002 |
| Phone | +1-555-0202 |

#### Patient 3: Owais Bhat (Test User)
| Field | Value |
|-------|-------|
| Email | `owais.bhat2612@gmail.com` |
| Full Name | Owais Bhat |
| User ID | ZEEkeIrS0YZf1nGX7lAfMvdsSAh2 |
| Phone | +1-555-0203 |

**Capabilities:**
- Browse available doctors
- Book appointments
- View appointment history
- Leave reviews
- Manage profile

---

## Sample Appointments

| ID | Patient | Doctor | Date | Time | Type | Status |
|----|---------|---------|-----------|----|------|--------|
| appt-001 | John Doe | Dr. Sarah Johnson | 2024-12-15 | 10:00 AM | Video | Confirmed |
| appt-002 | Jane Wilson | Dr. John Smith | 2024-12-16 | 2:00 PM | In-Person | Pending |

---

## Development Notes

- **Authentication:** Uses Firebase Auth (development mode with mock fallback)
- **Database:** Uses Supabase mock client (reads/writes from `db.json`)
- **All test accounts use email/password authentication**
- **Firebase emulator** setup recommended for local development
- **Session management** via authentication cookies

---

## Testing Workflow

1. **Super Admin Portal:** Test analytics and doctor management
2. **Doctor Portal:** Test appointment scheduling and patient communication
3. **Patient Portal:** Test browsing doctors, booking appointments, leaving reviews

---

## Reset Instructions

To reset to defaults:
1. Delete `db.json`
2. Restart the development server
3. Database will auto-initialize with these default accounts
