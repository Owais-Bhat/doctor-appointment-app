"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createAppointment(formData: {
  doctorId: string;
  date: string;
  time: string;
  patientId: string; // Pass patientId from client since server-side auth is changed
}) {
  const supabase = createClient();
  const { patientId } = formData;

  if (!patientId) {
    throw new Error("User must be authenticated to book an appointment");
  }

  // 1. Check if the slot is already taken
  const { data: existing = [], error: checkError } = await supabase
    .from("appointments")
    .select("id")
    .eq("doctor_id", formData.doctorId)
    .eq("appointment_date", formData.date)
    .eq("appointment_time", formData.time)
    .single();

  if (existing) {
    return { success: false, message: "This time slot is already booked." };
  }

  // 2. Create the appointment
  const { data, error } = await supabase
    .from("appointments")
    .insert([
      {
        patient_id: patientId,
        doctor_id: formData.doctorId,
        appointment_date: formData.date,
        appointment_time: formData.time,
        status: "confirmed",
      },
    ])
    .select();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/");
  return { success: true, data };
}

export async function getPatientProfile(userId: string) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}
