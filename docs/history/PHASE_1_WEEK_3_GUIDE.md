# Phase 1 Week 3: Architecture & Caching - Implementation Guide

**Week:** May 27 - June 2, 2026  
**Status:** Building  
**Focus:** Service layer, caching, background jobs, database optimization

---

## 📋 What Was Created

### 1. Service Layer Pattern ✅
**Files:**
- `src/lib/services/appointmentService.ts` - Appointment business logic
- `src/lib/services/patientService.ts` - Patient data management

**Features:**
- Separation of concerns (business logic separate from API routes)
- Error handling and validation
- Audit logging integration
- Cache invalidation
- Email/notification triggers
- Transaction management

**Usage:**
```typescript
import { AppointmentService } from '@/lib/services/appointmentService';

// Create appointment with all business logic
const result = await AppointmentService.createAppointment(
  appointmentData,
  userId,
  ipAddress
);

// Get patient profile with caching
const profile = await PatientService.getPatientProfile(patientId, userId);
```

### 2. Caching System ✅
**File:** `src/lib/cache/cacheManager.ts`

**Features:**
- In-memory cache store
- TTL-based expiration
- Tag-based invalidation
- Cache statistics
- Automatic cleanup
- Multiple cache presets

**Cache TTLs:**
```
SHORT:     1 minute (real-time data)
MEDIUM:    5 minutes (frequently updated)
DEFAULT:   15 minutes (standard)
LONG:      1 hour (rarely changes)
VERY_LONG: 1 day (static data)
```

**Cache Tags:**
```
USER, PROFILE, AUTH
APPOINTMENTS, APPOINTMENT, DOCTOR_SCHEDULE
PATIENT_DATA, MEDICAL_RECORDS, PRESCRIPTIONS
DOCTOR_LIST, DOCTOR_PROFILE
TRANSACTIONS, INVOICES
```

**Usage:**
```typescript
import { getCachedOrFetch, invalidateCacheTag, CacheTTL, CacheTags } from '@/lib/cache/cacheManager';

// Get with automatic caching
const data = await getCachedOrFetch(
  'cache_key',
  () => fetchFromDatabase(),
  { ttl: CacheTTL.DEFAULT, tags: [CacheTags.PATIENT_DATA] }
);

// Invalidate by tag
invalidateCacheTag(CacheTags.APPOINTMENTS);
```

### 3. Background Jobs System ✅
**File:** `src/lib/jobs/scheduler.ts`

**Predefined Jobs:**
- Appointment reminders (hourly)
- Session cleanup (daily)
- Audit log archival (weekly)
- Report generation (daily)
- External data sync (hourly)
- Notification processing (every 5 min)
- Health checks (every 5 min)

**Features:**
- Retry logic with exponential backoff
- Job status tracking
- Error reporting
- Automatic rescheduling
- Max retries configuration

**Usage:**
```typescript
import { startAllJobs, stopJob, getJobStatus } from '@/lib/jobs/scheduler';

// Start all jobs
startAllJobs();

// Check job status
const status = getJobStatus('appointment_reminders');

// Stop specific job
stopJob('appointment_reminders');
```

### 4. Database Query Utilities ✅
**File:** `src/lib/db/queries.ts`

**Query Collections:**
- UserQueries (CRUD + search)
- PatientQueries (profile, medical history, prescriptions)
- DoctorQueries (listing, profile, schedule, availability)
- AppointmentQueries (CRUD, conflicts, search)
- PaymentQueries (transactions, status updates)
- BulkOperations (batch operations)

**Optimization Utils:**
- Pagination helpers
- Field selection (reduce payload)
- Relationship loading
- Connection stats

**Usage:**
```typescript
import { AppointmentQueries, PatientQueries } from '@/lib/db/queries';

// Get with caching
const appointments = await AppointmentQueries.getForPatient(patientId);

// Update with cache invalidation
await PatientQueries.update(patientId, data);
```

---

## 🔧 How to Integrate

### Step 1: Update API Route Handler
```typescript
// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/lib/services/appointmentService';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const userId = request.headers.get('user-id');
    const ip = request.headers.get('x-forwarded-for');

    // Use service layer
    const result = await AppointmentService.createAppointment(data, userId, ip);

    const response = new NextResponse(
      JSON.stringify(result.body),
      { status: result.status }
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 2: Initialize Jobs on App Start
```typescript
// src/app/layout.tsx
import { useEffect } from 'react';
import { startAllJobs } from '@/lib/jobs/scheduler';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Start background jobs (server-side only)
    if (typeof window === 'undefined') {
      startAllJobs();
    }
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Step 3: Use Caching in Services
```typescript
// Example in service
async getPatientAppointments(patientId: string) {
  return getCachedOrFetch(
    `appointments:${patientId}`,
    () => AppointmentQueries.getForPatient(patientId),
    { ttl: CacheTTL.MEDIUM, tags: [CacheTags.APPOINTMENTS] }
  );
}
```

---

## 📊 Architecture Overview

```
API Route Handler
    ↓
Rate Limiting & Security Headers
    ↓
Input Validation (Zod)
    ↓
Service Layer
    ├→ Cache Check (getCachedOrFetch)
    ├→ Database Query (AppointmentQueries)
    ├→ Business Logic (AppointmentService)
    ├→ Audit Logging
    ├→ Cache Invalidation
    └→ Trigger Side Effects (emails, notifications)
    ↓
Standardized Response
    ↓
Return with Security Headers
```

---

## 🚀 Performance Optimizations

### Caching Strategy
1. **User Data:** Cache for 1 hour (rarely changes)
2. **Doctor Profiles:** Cache for 1 hour
3. **Doctor Schedule:** Cache for 5 minutes (changes during day)
4. **Patient Appointments:** Cache for 5 minutes (user can view own)
5. **Prescriptions:** Cache for 5 minutes (frequently accessed)
6. **Medical Records:** Cache for 15 minutes (static)

### Cache Invalidation
- On CREATE: Invalidate list tags
- On UPDATE: Invalidate specific record + list tags
- On DELETE: Invalidate specific record + list tags

**Example:**
```typescript
// When appointment created
invalidateCacheTag(CacheTags.DOCTOR_SCHEDULE);  // Doctor's schedule changed
invalidateCacheTag(CacheTags.APPOINTMENTS);      // Patient's appointments list

// When appointment updated
invalidateCacheTag(CacheTags.APPOINTMENT);       // Specific appointment

// When appointment cancelled
invalidateCacheTag(CacheTags.DOCTOR_SCHEDULE);  // Doctor availability changed
invalidateCacheTag(CacheTags.TRANSACTIONS);     // Refund affects transactions
```

### Database Query Optimization
1. **Select Fields Only:** Don't fetch unused columns
2. **Pagination:** Always paginate large result sets
3. **Indexes:** Create indexes on frequently queried fields
4. **Batch Operations:** Use bulk queries when possible
5. **Connection Pooling:** Reuse database connections

---

## 📈 Job Scheduling

### Appointment Reminders (Hourly)
- Query appointments 24 hours from now
- Send email reminders to patients
- Send notifications to doctors

### Session Cleanup (Daily)
- Delete sessions older than 30 days
- Log cleanup results

### Audit Log Archival (Weekly)
- Archive audit logs older than 90 days
- Compress and move to archive storage

### Report Generation (Daily)
- Generate appointment reports
- Calculate revenue & metrics
- Send to admin email

### External Sync (Hourly)
- Sync with Google Calendar
- Sync with insurance systems
- Sync with pharmacy data

### Notification Processing (Every 5 min)
- Send pending emails
- Send pending SMS
- Send push notifications

### Health Checks (Every 5 min)
- Check database connection
- Check cache availability
- Check job scheduler status
- Log results

---

## ✅ Integration Checklist

### Services
- [x] AppointmentService implemented
- [x] PatientService implemented
- [x] DoctorService template ready
- [x] Error handling in place
- [x] Audit logging integrated
- [x] Cache invalidation setup

### Caching
- [x] Cache manager created
- [x] TTL presets defined
- [x] Tag-based invalidation
- [x] Automatic cleanup
- [x] Cache statistics
- [x] Per-service cache keys

### Background Jobs
- [x] Scheduler framework
- [x] 7 predefined jobs
- [x] Retry logic
- [x] Status tracking
- [x] Error reporting
- [x] Custom job support

### Database
- [x] Query collections created
- [x] CRUD operations templated
- [x] Bulk operations
- [x] Optimization utilities
- [x] Connection helpers
- [x] Pagination support

---

## 🔍 Testing Checklist

### Service Layer
- [ ] Test successful appointment creation
- [ ] Test appointment conflict detection
- [ ] Test patient profile update
- [ ] Test error handling
- [ ] Test cache invalidation
- [ ] Test audit logging

### Caching
- [ ] Test cache hit/miss
- [ ] Test TTL expiration
- [ ] Test tag invalidation
- [ ] Test cleanup job
- [ ] Test memory usage

### Background Jobs
- [ ] Test job registration
- [ ] Test job execution
- [ ] Test retry logic
- [ ] Test error handling
- [ ] Test reschedule logic

### Database
- [ ] Test pagination
- [ ] Test field selection
- [ ] Test bulk operations
- [ ] Test connection pooling
- [ ] Test query optimization

---

## 📊 Metrics

| Component | Status | Files | Lines |
|-----------|--------|-------|-------|
| **Service Layer** | ✅ | 2 | 400+ |
| **Caching** | ✅ | 1 | 350+ |
| **Jobs** | ✅ | 1 | 300+ |
| **Database** | ✅ | 1 | 350+ |
| **Total Week 3** | ✅ | 5 | 1,400+ |

---

## 🎯 What Comes Next

### Phase 1 Weeks 4-6 (App Features)
- Video consultations
- Medical records upload
- Prescription management
- Payment processing
- Admin analytics

### Phase 2+ (Enterprise)
- Multi-clinic support
- Insurance integration
- Telehealth reports
- Loyalty programs
- API for partners

---

## 📚 File Summary

```
Week 3 Architecture & Caching:

src/lib/
├── services/
│   ├── appointmentService.ts     (300 lines)
│   └── patientService.ts         (200 lines)
├── cache/
│   └── cacheManager.ts           (350 lines)
├── jobs/
│   └── scheduler.ts              (300 lines)
└── db/
    └── queries.ts                (350 lines)

Total: 5 files, 1,400+ lines
```

---

## 💡 Key Principles

### Service Layer
- ✅ Handles all business logic
- ✅ Integrates with cache
- ✅ Logs all operations
- ✅ Validates inputs
- ✅ Manages side effects

### Caching
- ✅ Reduces database load
- ✅ Improves response time
- ✅ TTL prevents stale data
- ✅ Tag-based invalidation
- ✅ Automatic cleanup

### Jobs
- ✅ Runs async tasks
- ✅ Retries on failure
- ✅ Tracks execution
- ✅ Reports errors
- ✅ Prevents duplicates

### Database
- ✅ Query builder pattern
- ✅ Integrated caching
- ✅ Bulk operations
- ✅ Pagination support
- ✅ Field selection

---

**Week 3 Architecture & Caching: Ready for Integration** ✅

