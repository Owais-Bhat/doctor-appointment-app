import { GoogleGenAI, Type } from '@google/genai';
import { createAppointment, getPatientProfile } from '@/app/actions';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { message, userId, doctorId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User must be logged in to use the assistant.' }, { status: 401 });
    }

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
      
      let functionResponseData = {};

      if (call.name === 'book_appointment') {
        const args: any = call.args || {};
        const { date, time } = args;
        // Strictly override the doctorId with the specific SaaS Tenant ID from context
        const assignedDoctor = doctorId || args.doctorId || 'doc-123';
        try {
          const result = await createAppointment({ doctorId: assignedDoctor, date, time, patientId: userId });
          functionResponseData = result;
        } catch (err: any) {
          functionResponseData = { success: false, message: err.message };
        }
      } else if (call.name === 'get_health_report') {
        try {
          const profile = await getPatientProfile(userId);
          functionResponseData = {
            success: true,
            bloodType: profile?.blood_type || 'Unknown',
            healthStats: profile?.health_stats || 'No current issues reported. Standard vitals looking great.',
          };
        } catch (err: any) {
          functionResponseData = { success: false, message: "Could not fetch profile", error: err.message };
        }
      }

      // Send the function execution result back to Gemini so it can reply
      response = await chat.sendMessage({
        functionResponses: [{
          name: call.name,
          response: functionResponseData
        }]
      } as any); // Type cast due to generic sdk setup
    }

    return NextResponse.json({
      reply: response.text
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: 'AI service is temporarily unavailable' }, { status: 500 });
  }
}
