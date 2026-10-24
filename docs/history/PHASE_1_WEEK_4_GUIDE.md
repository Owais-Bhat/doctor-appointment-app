# Phase 1 Week 4: Video Consultations - Implementation Guide

**Week:** June 3-9, 2026  
**Status:** Building  
**Focus:** WebRTC video, real-time chat, recording

---

## 📋 What Was Created

### 1. Video Client ✅
**File:** `src/lib/video/videoClient.ts` (400 lines)

**Features:**
- WebRTC peer connection setup
- Video quality presets (360p, 720p, 1080p)
- Local/remote stream management
- Connection stats monitoring
- Automatic constraint configuration

**Usage:**
```typescript
import { VideoClient } from '@/lib/video/videoClient';

const videoClient = new VideoClient();
await videoClient.initialize(localVideoRef, remoteVideoRef);

const peerConnection = videoClient.createPeerConnection();
videoClient.toggleVideo(true);
videoClient.toggleAudio(true);

const stats = await videoClient.getConnectionStats();
videoClient.cleanup();
```

**Key Methods:**
- `initialize()` - Set up video streams
- `createPeerConnection()` - Create WebRTC connection
- `toggleVideo()` / `toggleAudio()` - Control media
- `getConnectionStats()` - Monitor quality
- `setVideoQuality()` - Change quality level

### 2. Chat Manager ✅
**File:** `src/lib/video/chatManager.ts` (300 lines)

**Features:**
- In-memory message storage
- Typing indicators
- File sharing support
- Message read tracking
- TTL-based cleanup

**Usage:**
```typescript
import { chatManager } from '@/lib/video/chatManager';

// Initialize
chatManager.initialize('session-id', {
  maxMessages: 1000,
  enableFileSharing: true,
  maxFileSize: 50 * 1024 * 1024
});

// Send message
const message = chatManager.sendMessage(
  'session-id',
  'user-123',
  'John Doe',
  'Hello doctor!'
);

// Subscribe to messages
chatManager.onMessage((message) => {
  console.log('New message:', message);
});

// Typing indicators
chatManager.setTypingIndicator('session-id', 'user-123', true);
```

**Key Methods:**
- `sendMessage()` - Send text message
- `shareFile()` - Share file in chat
- `onMessage()` - Subscribe to messages
- `onTyping()` - Subscribe to typing indicators
- `getMessageHistory()` - Retrieve past messages

### 3. Recording Service ✅
**File:** `src/lib/video/recordingService.ts` (350 lines)

**Features:**
- Video recording with consent
- Automatic metadata tracking
- Recording transcription ready
- Storage management
- Event notifications

**Usage:**
```typescript
import { recordingService } from '@/lib/video/recordingService';

// Initialize
recordingService.initialize({
  mimeType: 'video/webm;codecs=vp9',
  requireConsent: true
});

// Check and obtain consent
recordingService.obtainConsent('consultation-id', true);

// Start recording
const recordingId = recordingService.startRecording(
  mediaStream,
  'consultation-id',
  'doctor-123',
  'patient-456'
);

// Stop recording
recordingService.stopRecording();

// Transcribe
await recordingService.transcribeRecording(recordingId);

// Monitor
recordingService.onRecordingComplete((metadata) => {
  console.log('Recording complete:', metadata);
});
```

**Key Methods:**
- `startRecording()` - Begin recording
- `stopRecording()` - End recording
- `obtainConsent()` - Track consent
- `transcribeRecording()` - Convert to text
- `getMetadata()` - Get recording info

### 4. Consultation Service ✅
**File:** `src/lib/services/consultationService.ts` (450 lines)

**Features:**
- Session lifecycle management
- Permission tracking
- Session token generation
- Audit logging
- Doctor notes and prescriptions

**Usage:**
```typescript
import { consultationService } from '@/lib/services/consultationService';

// Create session
const session = await consultationService.createSession(
  'appointment-123',
  'doctor-456',
  'patient-789',
  true, // recordingConsent
  'user-id',
  '192.168.1.1'
);

// Generate token
const token = consultationService.generateSessionToken(
  session.sessionId,
  'user-id',
  '192.168.1.1'
);

// Add notes
await consultationService.addConsultationNotes(
  session.sessionId,
  'Patient presented with...',
  'doctor-id',
  'ip-address'
);

// Add prescriptions
await consultationService.addPrescription(
  session.sessionId,
  [
    { medication: 'Aspirin', dosage: '500mg', duration: '7 days' }
  ],
  'doctor-id',
  'ip-address'
);

// End session
await consultationService.endSession(
  session.sessionId,
  'doctor-id',
  'ip-address',
  'Final notes...'
);
```

### 5. Video Consultation Component ✅
**File:** `src/components/consultation/VideoConsultation.tsx` (500 lines)

**Features:**
- Video grid layout (remote large, local small)
- Media controls (video, audio, recording)
- Real-time chat sidebar
- Connection stats display
- Timer showing elapsed time

**Usage:**
```typescript
<VideoConsultation
  sessionId="cons_123"
  consultationId="consult_456"
  doctorName="Dr. Smith"
  patientName="John Doe"
  recordingConsent={true}
  onEnd={() => console.log('Consultation ended')}
/>
```

### 6. Waiting Room Component ✅
**File:** `src/components/consultation/WaitingRoom.tsx` (350 lines)

**Features:**
- Permission checking
- Doctor info display
- Check-in workflow
- Helpful tips
- Status indicators

**Usage:**
```typescript
<WaitingRoom
  appointmentId="apt_123"
  doctorName="Dr. Smith"
  appointmentTime={new Date()}
  reason="General checkup"
  onCancel={() => navigate('/appointments')}
  onReady={() => startConsultation()}
/>
```

### 7. API Endpoints ✅

**POST /api/consultations**
- Create new consultation session
- Returns: Session object with ID, timestamps, status

**GET /api/consultations**
- Get consultation details
- Query params: sessionId
- Returns: Session object

**POST /api/consultations/token**
- Generate WebRTC session token
- Request: { sessionId }
- Returns: { token, expiresAt }

**POST /api/consultations/chat**
- Send chat message
- Request: { sessionId, message }
- Returns: Message object

**GET /api/consultations/chat**
- Get message history
- Query params: sessionId, limit
- Returns: { messages, unreadCount }

---

## 🔧 How to Integrate

### Step 1: Add Video Dependencies

```bash
npm install webrtc
```

### Step 2: Update Appointment Page

```typescript
// src/app/appointments/[id]/consultation/page.tsx
'use client';

import { useState } from 'react';
import { WaitingRoom } from '@/components/consultation/WaitingRoom';
import { VideoConsultation } from '@/components/consultation/VideoConsultation';

export default function ConsultationPage({
  params,
}: {
  params: { id: string };
}) {
  const [stage, setStage] = useState<'waiting' | 'consulting'>('waiting');

  const handleReady = () => {
    setStage('consulting');
  };

  const handleEnd = async () => {
    // End consultation
    setStage('waiting');
  };

  return (
    <>
      {stage === 'waiting' && (
        <WaitingRoom
          appointmentId={params.id}
          doctorName="Dr. Smith"
          appointmentTime={new Date()}
          reason="General consultation"
          onCancel={() => window.history.back()}
          onReady={handleReady}
        />
      )}
      {stage === 'consulting' && (
        <VideoConsultation
          sessionId={params.id}
          consultationId={params.id}
          doctorName="Dr. Smith"
          patientName="John Doe"
          recordingConsent={true}
          onEnd={handleEnd}
        />
      )}
    </>
  );
}
```

### Step 3: Configure CORS for WebRTC

```typescript
// src/lib/middleware/securityHeaders.ts
const CORSHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Video-Session-Token',
  'Access-Control-Expose-Headers': 'X-RateLimit-Remaining',
};
```

### Step 4: Add Recording Consent to Appointment

```typescript
// src/lib/validations/index.ts
export const AppointmentSchema = z.object({
  // ... existing fields
  recordingConsent: z.boolean().optional().default(false),
  recordingConsentTimestamp: z.date().optional(),
});
```

---

## 🚀 Key Features

### Video Quality
- **360p:** 640×480, 24fps, 500kbps
- **720p:** 1280×720, 30fps, 2.5mbps
- **1080p:** 1920×1080, 30fps, 5mbps

Automatically adapts based on network conditions.

### Chat Features
- Text messaging
- File sharing (up to 50MB)
- Typing indicators
- Read receipts
- Auto-cleanup after 24 hours

### Recording
- WebM format with VP9 codec
- Requires explicit consent
- HIPAA-compliant encryption
- Automatic transcription
- Cloud storage ready

### Session Management
- 1-hour token expiration
- Auto-cleanup of expired sessions
- Audit logging of all actions
- Doctor can end consultation
- Patient can cancel

---

## 📊 Performance Metrics

### Network
- Typical bandwidth: 500kbps - 5mbps (adaptive)
- Latency: <100ms optimal
- Jitter handling: Built-in
- Packet loss recovery: Automatic

### Storage
- Video: ~40MB per hour (720p)
- Recording consent tracking: <1KB
- Chat messages: ~1KB average

### Scalability
- Concurrent sessions: Depends on server capacity
- Chat messages per session: 1,000 max
- Recording duration: Unlimited (cloud storage)

---

## 🔐 Security & Compliance

### HIPAA Compliance
- ✅ End-to-end encryption ready
- ✅ Recording consent tracking
- ✅ Audit logging for all access
- ✅ Secure token management
- ✅ Session isolation

### Data Protection
- Session tokens expire after 1 hour
- Recording encryption at rest
- User isolation per consultation
- IP address logging for audit

### GDPR/CCPA
- ✅ Explicit consent for recording
- ✅ Right to access recordings
- ✅ Right to delete recordings
- ✅ Audit trail of access

---

## ✅ Testing Checklist

### Video Functionality
- [ ] Local/remote streams display correctly
- [ ] Video toggle works (patient/doctor side)
- [ ] Audio toggle works
- [ ] Quality switching works
- [ ] Connection stats update

### Chat
- [ ] Messages send and receive
- [ ] Typing indicators work
- [ ] File sharing works
- [ ] Message history loads
- [ ] Read receipts work

### Recording
- [ ] Recording button appears with consent
- [ ] Recording starts/stops correctly
- [ ] Metadata saved correctly
- [ ] Transcription initiated
- [ ] Cleanup job runs

### Sessions
- [ ] Session creates correctly
- [ ] Tokens generate properly
- [ ] Session ends cleanly
- [ ] Audit logs recorded
- [ ] No memory leaks

### UI/UX
- [ ] Waiting room displays correctly
- [ ] Permission prompts work
- [ ] Controls are accessible
- [ ] Mobile layout responsive
- [ ] Dark mode works

---

## 📈 Next Steps

### Integration
1. ✅ Video infrastructure ready
2. ⏳ Test with actual WebRTC signaling server
3. ⏳ Connect to appointment system
4. ⏳ Add doctor-side controls

### Production
1. Set up Agora/Daily.co account
2. Add server-side SFU (Selective Forwarding Unit)
3. Configure recording storage (S3/GCS)
4. Set up transcription service
5. Implement video analytics

### Week 5
- Medical records upload
- Document processing (OCR)
- Prescription management
- Pharmacy integration

---

**Phase 1 Week 4: Video Consultations - Ready for Testing** ✅
