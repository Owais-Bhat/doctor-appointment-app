/** Human wording for audit log actions, shared by the admin overview and audit log. */
export const AUDIT_LABEL: Record<string, string> = {
  approve_doctor: 'verified a doctor',
  revoke_doctor: 'hid a doctor from search',
  promote_to_doctor: 'made a user a doctor',
  demote_to_patient: 'changed a doctor back to patient',
  suspend_user: 'suspended an account',
  reactivate_user: 'reactivated an account',
  appointment_confirmed: 'confirmed a visit',
  appointment_cancelled: 'cancelled a visit',
  appointment_completed: 'completed a visit',
  appointment_no_show: 'marked a patient as not attending',
  payment_completed: 'paid for a visit',
  refund_failed: 'refund failed — refund from the Razorpay dashboard',
}

export type AuditTone = 'good' | 'bad' | 'neutral'

export function auditTone(action: string): AuditTone {
  if (/approve|reactivate|confirm|complete|payment|promote/.test(action)) return 'good'
  if (/revoke|suspend|cancel|demote|no_show|fail/.test(action)) return 'bad'
  return 'neutral'
}

export function auditLabel(action: string): string {
  return AUDIT_LABEL[action] ?? action.replace(/_/g, ' ')
}

export function timeAgo(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  if (hrs < 48) return 'Yesterday'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
