import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { bookAppointment } from '@/lib/appointments';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter';

export async function POST(request: Request) {
  try {
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'User must be logged in to use the assistant.' }, { status: 401 });
    }

    const { message, doctorId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
    }

    const limit = checkRateLimitByUser(`ai-chat:${userId}`, { windowMs: 60_000, maxRequests: 20 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many messages. Please wait a minute.' }, { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        reply: "AI booking is configured in demo mode. Add GEMINI_API_KEY to enable live Gemini appointment orchestration."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const systemPrompt = `
      You are the Medical Assistant specifically dedicated to Doctor with ID: ${doctorId || 'General Clinic'}.
      Your specific goal is to help patients book an appointment EXCLUSIVELY with this doctor.
      Do not offer or book appointments with other providers.
      Ask the user to describe their discomfort and help route their booking.

      CRITICAL RULES:
      1. NEVER provide a definitive medical diagnosis.
      2. ALWAYS include a disclaimer that you are an AI and not a doctor.
      3. RECOMMEND specific specialists (e.g., "I suggest seeing a Cardiologist" or "You should consult a Neurologist").
      4. Keep responses empathetic, professional, and concise.
      5. If symptoms sound emergency-level (chest pain, severe bleeding), urge the user to call emergency services immediately.

      Symptom Mapping Guide:
      - Chest pain, heart palpitations -> Cardiologist
      - Headaches, numbness, seizures -> Neurologist
      - Skin rashes, acne, moles -> Dermatologist
      - Joint pain, bone fractures -> Orthopedic Surgeon
      - Stomach pain, acid reflux -> Gastroenterologist
      - Ear, nose, throat issues -> ENT Specialist
    `;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        tools: [{
          functionDeclarations: [
            {
              name: 'book_appointment',
              description: 'Book an appointment with a doctor for the user. Use this when the user explicitly agrees to book an appointment after discussing their symptoms.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  doctorId: { type: Type.STRING, description: 'The ID of the doctor (e.g. "doc-123"). Since doctors are generic right now, just pass a UUID or name.' },
                  date: { type: Type.STRING, description: 'The date for the appointment in YYYY-MM-DD format.' },
                  time: { type: Type.STRING, description: 'The time for the appointment in HH:MM format.' },
                },
                required: ['doctorId', 'date', 'time'],
              },
            },
            {
              name: 'get_health_report',
              description: 'Fetches the user\'s current health report and vitals for discussion.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  reason: { type: Type.STRING, description: 'Why the user wants the report.' }
                }
              }
            }
          ]
        }]
      }
    });

    let response = await chat.sendMessage({ message });

    // Handle function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      let functionResponseData: Record<string, unknown> = {};

      if (call.name === 'book_appointment') {
        const args = (call.args || {}) as { doctorId?: string; date?: string; time?: string };
        const date = String(args.date ?? '');
        const time = String(args.time ?? '');
        // Strictly override the doctorId with the specific SaaS Tenant ID from context
        const assignedDoctor = String(doctorId || args.doctorId || '');
        const result = await bookAppointment({ patientId: userId, doctorId: assignedDoctor, date, time });
        functionResponseData = result.ok
          ? { success: true, message: 'Appointment requested. It is pending confirmation.' }
          : { success: false, message: result.error };
      } else if (call.name === 'get_health_report') {
        // Only ever the signed-in user's own profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('blood_type, health_stats')
          .eq('id', userId)
          .maybeSingle();
        functionResponseData = profile
          ? {
              success: true,
              bloodType: profile.blood_type || 'Unknown',
              healthStats: profile.health_stats || 'No health information on file.',
            }
          : { success: false, message: 'Could not fetch profile' };
      }

      // Send the function execution result back to Gemini so it can reply
      response = await chat.sendMessage({
        message: [{
          functionResponse: {
            id: call.id,
            name: call.name,
            response: functionResponseData,
          },
        }],
      });
    }

    return NextResponse.json({
      reply: response.text
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: 'AI service is temporarily unavailable' }, { status: 500 });
  }
}
