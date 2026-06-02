/**
 * Smart Documentation API Routes
 *
 * POST /api/ai/documentation
 * - action: transcribe - Transcribe consultation audio
 * - action: generate-soap - Generate SOAP note
 * - action: generate-progress - Generate progress note
 * - action: edit-finalize - Edit and finalize note
 *
 * GET /api/ai/documentation
 * - action: patient-notes - Get patient's notes
 * - action: note - Get specific note
 * - action: summarize - Get note summary
 * - action: extract-medications - Extract medications from note
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartDocumentationService } from '@/lib/services/smartDocumentationService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'transcribe') {
      const { appointmentId, audioData } = body;

      if (!appointmentId) {
        return NextResponse.json(
          { success: false, error: 'Missing appointment ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const transcription = await SmartDocumentationService.transcribeConsultation(
        appointmentId,
        Buffer.from(audioData || '')
      );

      return NextResponse.json(
        { success: true, data: { transcription } },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'generate-soap') {
      const { appointmentId, doctorId, patientId, transcription } = body;

      if (!appointmentId || !doctorId || !patientId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const note = await SmartDocumentationService.generateSOAPNote(
        appointmentId,
        doctorId,
        patientId,
        transcription || []
      );

      return NextResponse.json(
        { success: true, data: note },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'generate-progress') {
      const { appointmentId, doctorId, patientId } = body;

      if (!appointmentId || !doctorId || !patientId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const note = await SmartDocumentationService.generateProgressNote(
        appointmentId,
        doctorId,
        patientId,
        []
      );

      return NextResponse.json(
        { success: true, data: note },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'edit-finalize') {
      const { noteId, doctorId, edits } = body;

      if (!noteId || !doctorId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const note = await SmartDocumentationService.editAndFinalize(noteId, doctorId, edits || {});

      if (!note) {
        return NextResponse.json(
          { success: false, error: 'Note not found' },
          { status: 404, headers: securityHeaders() }
        );
      }

      return NextResponse.json(
        { success: true, data: note },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/ai/documentation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const patientId = req.nextUrl.searchParams.get('patientId');
    const noteId = req.nextUrl.searchParams.get('noteId');
    const format = req.nextUrl.searchParams.get('format') || 'json';

    if (action === 'patient-notes') {
      if (!patientId) {
        return NextResponse.json(
          { success: false, error: 'Missing patient ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const notes = await SmartDocumentationService.getNotesByPatient(patientId);

      return NextResponse.json(
        { success: true, data: { notes } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'note') {
      if (!noteId) {
        return NextResponse.json(
          { success: false, error: 'Missing note ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const note = await SmartDocumentationService.getNoteById(noteId);

      if (!note) {
        return NextResponse.json(
          { success: false, error: 'Note not found' },
          { status: 404, headers: securityHeaders() }
        );
      }

      return NextResponse.json(
        { success: true, data: note },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'export') {
      if (!noteId) {
        return NextResponse.json(
          { success: false, error: 'Missing note ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const exported = await SmartDocumentationService.exportNote(
        noteId,
        (format as 'pdf' | 'txt' | 'fhir') || 'txt'
      );

      return NextResponse.json(
        { success: true, data: { content: exported } },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/ai/documentation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
