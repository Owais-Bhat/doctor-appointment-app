import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken, appointmentData } = body;

    // 1. Verify Firebase Token Server-Side
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = decodedToken.uid;
    const supabase = await createClient();

    // 2. Check for double-booking (same doctor, date, and time)
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', appointmentData.doctorId)
      .eq('appointment_date', appointmentData.date)
      .eq('appointment_time', appointmentData.time)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
    }

    // 3. Create Appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: appointmentData.doctorId,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        status: 'confirmed',
        consultation_type: appointmentData.type || 'in_person'
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Create Notification for both parties
    await supabase.from('notifications').insert([
      {
        user_id: patientId,
        title: 'Appointment Confirmed!',
        message: `Your appointment with Dr. ${appointmentData.doctorName} is set for ${appointmentData.date}.`,
        type: 'success',
        related_appointment_id: data.id
      },
      {
        user_id: appointmentData.doctorProfileId,
        title: 'New Appointment',
        message: `Patient ${appointmentData.patientName} has booked a slot on ${appointmentData.date}.`,
        type: 'info',
        related_appointment_id: data.id
      }
    ]);

    return NextResponse.json({ success: true, appointment: data });
  } catch (error: any) {
    console.error('Appointment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
