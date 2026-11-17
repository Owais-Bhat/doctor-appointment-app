/** Human wording for audit log actions (same as the web app's admin pages). */
const LABEL: Record<string, string> = {
  approve_doctor: 'verified a doctor',
  revoke_doctor: 'hid a doctor from search',
  promote_to_doctor: 'made a user a doctor',
  demote_to_patient: 'changed a doctor back to patient',
  suspend_user: 'suspended an account',
  reactivate_user: 'reactivated an account',
  create_doctor: 'added a doctor',
  claim_seeded_admin: 'signed in as the first admin',
  appointment_confirmed: 'confirmed a visit',
  appointment_cancelled: 'cancelled a visit',
  appointment_completed: 'completed a visit',
  appointment_no_show: 'marked a patient as not attending',
  payment_completed: 'paid for a visit',
  refund_failed: 'refund failed — refund from the Razorpay dashboard',
};

export const auditLabel = (action: string) => LABEL[action] ?? action.replace(/_/g, ' ');

export type AuditTone = 'good' | 'bad' | 'neutral';
export function auditTone(action: string): AuditTone {
  if (/approve|reactivate|confirm|complete|payment|promote/.test(action)) return 'good';
  if (/revoke|suspend|cancel|demote|no_show|fail/.test(action)) return 'bad';
  return 'neutral';
}
