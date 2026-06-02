/**
 * Smart Documentation Service
 * Medical transcription, auto-generated notes, and intelligent documentation
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface TranscriptionSegment {
  timestamp: number;
  speaker: 'doctor' | 'patient' | 'other';
  text: string;
  confidence: number;
}

interface GeneratedNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  type: 'soap' | 'progress' | 'encounter' | 'procedure';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  transcription: TranscriptionSegment[];
  keyFindings: string[];
  recommendations: string[];
  medications: { name: string; dosage: string; frequency: string }[];
  followUp: { type: string; timeframe: string }[];
  editedByDoctor: boolean;
  editedAt?: Date;
  finalizedAt?: Date;
  createdAt: Date;
}

const generatedNotes = new Map<string, GeneratedNote>();
const transcriptions = new Map<string, TranscriptionSegment[]>();

export class SmartDocumentationService {
  static async transcribeConsultation(
    appointmentId: string,
    audioData: Buffer
  ): Promise<TranscriptionSegment[]> {
    // Simulate transcription with mock data
    const mockTranscription: TranscriptionSegment[] = [
      {
        timestamp: 0,
        speaker: 'doctor',
        text: "Good morning, how are you feeling today?",
        confidence: 0.98,
      },
      {
        timestamp: 5,
        speaker: 'patient',
        text: "I've had some chest pain on and off for the past week.",
        confidence: 0.95,
      },
      {
        timestamp: 15,
        speaker: 'doctor',
        text: "Let me examine you. Can you describe the pain? Sharp, dull, or pressure?",
        confidence: 0.97,
      },
      {
        timestamp: 22,
        speaker: 'patient',
        text: "It's more of a dull pressure, especially when I exert myself.",
        confidence: 0.93,
      },
    ];

    transcriptions.set(appointmentId, mockTranscription);
    return mockTranscription;
  }

  static async generateSOAPNote(
    appointmentId: string,
    doctorId: string,
    patientId: string,
    transcription: TranscriptionSegment[]
  ): Promise<GeneratedNote> {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract key information from transcription
    const patientStatements = transcription
      .filter((s) => s.speaker === 'patient')
      .map((s) => s.text)
      .join(' ');

    const note: GeneratedNote = {
      id: noteId,
      appointmentId,
      doctorId,
      patientId,
      type: 'soap',
      subjective: `Patient reports: ${patientStatements.substring(0, 200)}...`,
      objective: 'Vital signs stable. Physical examination findings: Normal cardiovascular exam.',
      assessment: 'Chest pain, etiology to be determined. Rule out cardiac origin.',
      plan: 'Order EKG and troponin levels. Follow up in 2-3 days with results.',
      transcription,
      keyFindings: [
        'Chest discomfort with exertion',
        'Onset 1 week ago',
        'No significant past medical history',
      ],
      recommendations: [
        'Perform EKG to rule out cardiac origin',
        'Consider stress test if EKG normal',
        'Lifestyle modification: avoid strenuous activity until cleared',
      ],
      medications: [
        {
          name: 'Aspirin',
          dosage: '81 mg',
          frequency: 'Once daily',
        },
      ],
      followUp: [
        {
          type: 'In-office',
          timeframe: '3 days',
        },
      ],
      editedByDoctor: false,
      createdAt: new Date(),
    };

    generatedNotes.set(noteId, note);
    await logAudit(doctorId, AuditAction.DOCUMENT_CREATED, 'MEDICAL_NOTE', noteId, {
      status: 'SUCCESS',
      details: { appointmentId, type: 'soap', patientId },
    });

    return note;
  }

  static async generateProgressNote(
    appointmentId: string,
    doctorId: string,
    patientId: string,
    previousNotes: GeneratedNote[]
  ): Promise<GeneratedNote> {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const note: GeneratedNote = {
      id: noteId,
      appointmentId,
      doctorId,
      patientId,
      type: 'progress',
      subjective: 'Patient reports improvement in symptoms. Pain decreased by 50%.',
      objective: 'Vital signs: BP 120/80, HR 72. EKG from previous visit reviewed - normal.',
      assessment: 'Chest pain, improved. Likely musculoskeletal in origin.',
      plan: 'Continue current regimen. Can resume normal activities gradually. Recheck in 2 weeks.',
      transcription: [],
      keyFindings: [
        'Clinical improvement noted',
        'EKG results normal',
        'No cardiac findings',
      ],
      recommendations: [
        'Continue current pain management',
        'Gradual return to normal activities',
        'Monitor for recurrence',
      ],
      medications: [
        {
          name: 'Ibuprofen',
          dosage: '400 mg',
          frequency: 'As needed',
        },
      ],
      followUp: [
        {
          type: 'Telephone',
          timeframe: '2 weeks',
        },
      ],
      editedByDoctor: false,
      createdAt: new Date(),
    };

    generatedNotes.set(noteId, note);
    await logAudit(doctorId, AuditAction.DOCUMENT_CREATED, 'MEDICAL_NOTE', noteId, {
      status: 'SUCCESS',
      details: { appointmentId, type: 'progress' },
    });

    return note;
  }

  static async smartSummarize(
    appointmentId: string,
    noteContent: string
  ): Promise<{
    summary: string;
    keyPoints: string[];
    nextSteps: string[];
  }> {
    return {
      summary: noteContent.substring(0, 150) + '...',
      keyPoints: [
        'Patient presented with chief complaint',
        'Physical examination performed',
        'Diagnostic plan established',
      ],
      nextSteps: [
        'Complete ordered tests',
        'Schedule follow-up appointment',
        'Prescribe indicated medications',
      ],
    };
  }

  static async extractMedications(note: GeneratedNote): Promise<string[]> {
    return note.medications.map((m) => `${m.name} ${m.dosage} ${m.frequency}`);
  }

  static async extractAllergies(note: GeneratedNote): Promise<string[]> {
    // In real system, would parse from assessment/note text
    return ['Penicillin - rash', 'NSAIDs - GI upset'];
  }

  static async editAndFinalize(
    noteId: string,
    doctorId: string,
    edits: Partial<GeneratedNote>
  ): Promise<GeneratedNote | null> {
    const note = generatedNotes.get(noteId);
    if (!note) return null;

    const updatedNote = {
      ...note,
      ...edits,
      editedByDoctor: true,
      editedAt: new Date(),
      finalizedAt: new Date(),
    };

    generatedNotes.set(noteId, updatedNote);
    await logAudit(doctorId, AuditAction.DOCUMENT_MODIFIED, 'MEDICAL_NOTE', noteId, {
      status: 'SUCCESS',
      details: { finalized: true },
    });

    return updatedNote;
  }

  static async getNotesByPatient(patientId: string): Promise<GeneratedNote[]> {
    return Array.from(generatedNotes.values())
      .filter((n) => n.patientId === patientId && n.finalizedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async getNoteById(noteId: string): Promise<GeneratedNote | undefined> {
    return generatedNotes.get(noteId);
  }

  static async exportNote(
    noteId: string,
    format: 'pdf' | 'txt' | 'fhir'
  ): Promise<string> {
    const note = generatedNotes.get(noteId);
    if (!format || !note) return '';

    if (format === 'txt') {
      return `
SOAP NOTE
=========
Patient: ${note.patientId}
Doctor: ${note.doctorId}
Date: ${note.createdAt.toISOString()}

SUBJECTIVE:
${note.subjective}

OBJECTIVE:
${note.objective}

ASSESSMENT:
${note.assessment}

PLAN:
${note.plan}
      `;
    }

    return JSON.stringify(note);
  }
}
