# MedFlow Test Data Reference

## Quick Access Table

| Role | Email | Password | User ID | Portal |
|------|-------|----------|---------|--------|
| **Super Admin** | admin@medflow.com | Firebase Auth | super-admin-uid-001 | `/super-admin/dashboard` |
| **Doctor** | dr.sarah@medflow.com | Firebase Auth | doctor-uid-001 | `/admin/dashboard` |
| **Doctor** | dr.john@medflow.com | Firebase Auth | doctor-uid-002 | `/admin/dashboard` |
| **Patient** | patient@example.com | Firebase Auth | patient-uid-001 | `/client/dashboard` |
| **Patient** | jane@example.com | Firebase Auth | patient-uid-002 | `/client/dashboard` |
| **Patient** | owais.bhat2612@gmail.com | Firebase Auth | ZEEkeIrS0YZf1nGX7lAfMvdsSAh2 | `/client/dashboard` |

---

## Complete Profile Data

### Super Admin Profile
```json
{
  "id": "super-admin-uid-001",
  "email": "admin@medflow.com",
  "full_name": "MedFlow Admin",
  "role": "super_admin",
  "phone": "+1-555-0100"
}
```
**Capabilities:** Platform analytics, doctor verification, system monitoring

---

### Doctor Profile 1
```json
{
  "profile": {
    "id": "doctor-uid-001",
    "email": "dr.sarah@medflow.com",
    "full_name": "Dr. Sarah Johnson",
    "role": "doctor",
    "phone": "+1-555-0101"
  },
  "doctor_profile": {
    "id": "doc-prof-001",
    "profile_id": "doctor-uid-001",
    "specialty": "Cardiology",
    "bio": "Experienced cardiologist with 12 years of practice",
    "qualifications": "MD, Board Certified",
    "experience_years": 12,
    "consultation_fee": 150,
    "rating": 4.8,
    "total_reviews": 45,
    "is_verified": true,
    "clinic_name": "Heart Care Clinic",
    "languages": "English, Spanish"
  }
}
```

---

### Doctor Profile 2
```json
{
  "profile": {
    "id": "doctor-uid-002",
    "email": "dr.john@medflow.com",
    "full_name": "Dr. John Smith",
    "role": "doctor",
    "phone": "+1-555-0102"
  },
  "doctor_profile": {
    "id": "doc-prof-002",
    "profile_id": "doctor-uid-002",
    "specialty": "General Practice",
    "bio": "Dedicated general practitioner focused on preventive care",
    "qualifications": "MD, MRCGP",
    "experience_years": 8,
    "consultation_fee": 100,
    "rating": 4.6,
    "total_reviews": 32,
    "is_verified": true,
    "clinic_name": "Primary Health Center",
    "languages": "English, French"
  }
}
```

---

### Patient Profiles
```json
[
  {
    "id": "patient-uid-001",
    "email": "patient@example.com",
    "full_name": "John Doe",
    "role": "patient",
    "phone": "+1-555-0201"
  },
  {
    "id": "patient-uid-002",
    "email": "jane@example.com",
    "full_name": "Jane Wilson",
    "role": "patient",
    "phone": "+1-555-0202"
  },
  {
    "id": "ZEEkeIrS0YZf1nGX7lAfMvdsSAh2",
    "email": "owais.bhat2612@gmail.com",
    "full_name": "Owais Bhat",
    "role": "patient",
    "phone": "+1-555-0203"
  }
]
```

---

## Sample Appointments

### Appointment 1
```json
{
  "id": "appt-001",
  "patient_id": "patient-uid-001",
  "patient_name": "John Doe",
  "doctor_id": "doc-prof-001",
  "doctor_name": "Dr. Sarah Johnson",
  "appointment_date": "2024-12-15",
  "appointment_time": "10:00",
  "status": "confirmed",
  "consultation_type": "video",
  "chief_complaint": "Regular checkup"
}
```
**Status:** CONFIRMED | **Type:** Video Call | **Duration:** 30 minutes

### Appointment 2
```json
{
  "id": "appt-002",
  "patient_id": "patient-uid-002",
  "patient_name": "Jane Wilson",
  "doctor_id": "doc-prof-002",
  "doctor_name": "Dr. John Smith",
  "appointment_date": "2024-12-16",
  "appointment_time": "14:00",
  "status": "pending",
  "consultation_type": "in-person",
  "chief_complaint": "Flu symptoms"
}
```
**Status:** PENDING | **Type:** In-Person | **Location:** Primary Health Center

---

## API Endpoints Reference

### Authentication
```
GET  /api/auth/me              - Get current user profile
POST /api/auth/session         - Create session
DELETE /api/auth/session       - Clear session
```

### Doctors
```
GET  /api/doctors              - List verified doctors
GET  /api/doctor/schedule      - Get doctor's schedule
GET  /api/super-admin/doctors  - Admin: manage doctors
```

### Appointments
```
GET  /api/appointments         - List doctor's appointments
GET  /api/patient/appointments - List patient's appointments
POST /api/appointments         - Create appointment
```

### Admin/Analytics
```
GET  /api/super-admin/stats    - Platform statistics
GET  /api/super-admin/analytics - Detailed analytics
```

---

## Expected API Responses

### Doctor List (Verified Only)
```json
{
  "doctors": [
    {
      "id": "doc-prof-001",
      "specialty": "Cardiology",
      "rating": 4.8,
      "total_reviews": 45,
      "consultation_fee": 150,
      "profiles": {
        "full_name": "Dr. Sarah Johnson",
        "email": "dr.sarah@medflow.com"
      }
    }
  ],
  "count": 2
}
```

### Current User (After Login)
```json
{
  "profile": {
    "id": "doctor-uid-001",
    "email": "dr.sarah@medflow.com",
    "full_name": "Dr. Sarah Johnson",
    "role": "doctor"
  },
  "uid": "doctor-uid-001"
}
```

### Appointments for Doctor
```json
{
  "appointments": [
    {
      "id": "appt-001",
      "appointment_time": "10:00",
      "status": "confirmed",
      "consultation_type": "video",
      "chief_complaint": "Regular checkup",
      "profiles": {
        "full_name": "John Doe",
        "phone": "+1-555-0201"
      }
    }
  ]
}
```

---

## Testing Workflows

### Patient Booking Workflow
```
1. Login as patient@example.com
2. Dashboard → Book appointment
3. Browse doctors (should see 2 verified doctors)
4. Select Dr. Sarah Johnson (Cardiology)
5. Choose date/time (future date)
6. Submit booking
7. View in "My Appointments"
```

### Doctor Daily View Workflow
```
1. Login as dr.sarah@medflow.com
2. Admin Dashboard → Today view
3. See appointment with John Doe at 10:00 AM
4. Video consultation info available
5. Patient notes visible
```

### Super Admin Monitoring Workflow
```
1. Login as admin@medflow.com
2. Super Admin Dashboard
3. View platform stats (users, doctors, appointments)
4. Access doctor management
5. Verify/unverify doctors as needed
```

---

## Database File Structure

```
db.json
├── profiles[]
│   ├── id (string) - unique identifier
│   ├── email (string)
│   ├── full_name (string)
│   ├── role (enum: 'patient'|'doctor'|'super_admin')
│   └── phone (string)
├── doctor_profiles[]
│   ├── id (string)
│   ├── profile_id (string) - foreign key to profiles
│   ├── specialty (string)
│   ├── experience_years (number)
│   ├── consultation_fee (number)
│   ├── rating (number)
│   ├── is_verified (boolean)
│   └── clinic_name (string)
├── appointments[]
│   ├── id (string)
│   ├── patient_id (string)
│   ├── doctor_id (string)
│   ├── appointment_date (string: YYYY-MM-DD)
│   ├── appointment_time (string: HH:MM)
│   ├── status (enum)
│   └── consultation_type (enum)
├── notifications[]
└── audit_logs[]
```

---

## Important Notes

- **Authentication:** Uses Firebase (configured for demo mode)
- **Database:** Mock client reading from `db.json`
- **All IDs:** Must be unique across their table
- **Foreign Keys:** Must reference existing profile IDs
- **Dates:** Use YYYY-MM-DD format
- **Times:** Use 24-hour HH:MM format
- **Doctor Verification:** Only verified doctors appear in listings

---

## Customization Examples

### Add New Doctor
```json
{
  "id": "doctor-uid-003",
  "email": "dr.new@medflow.com",
  "full_name": "Dr. New Doctor",
  "role": "doctor",
  "phone": "+1-555-0103"
}
```

### Create Doctor Profile
```json
{
  "id": "doc-prof-003",
  "profile_id": "doctor-uid-003",
  "specialty": "Neurology",
  "experience_years": 10,
  "consultation_fee": 200,
  "rating": 4.7,
  "total_reviews": 28,
  "is_verified": true,
  "clinic_name": "Brain Wellness Center",
  "languages": "English, Spanish, German"
}
```

---

## Reset Instructions

To reset the database to default test data:
1. Delete `db.json`
2. Restart the development server
3. Database auto-initializes with default accounts
