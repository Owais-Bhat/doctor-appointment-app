/**
 * Local-only authentication for the seeded accounts in db.json.
 * It is enabled only when Firebase has not been configured.
 */

export const DEMO_PASSWORD = "password123";

export const IS_DEMO_AUTH =
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "demo-api-key";

export type DemoUser = {
  uid: string;
  email: string;
  displayName: string;
  getIdToken: () => Promise<string>;
};

export const DEMO_ACCOUNTS = [
  { uid: "super-admin-uid-001", email: "admin@medflow.com", name: "MedFlow Admin" },
  { uid: "6xQ94ouNynR2sDloWafXFWNB7I72", email: "admin@test.com", name: "Owais" },
  { uid: "doctor-uid-001", email: "dr.sarah@medflow.com", name: "Dr. Sarah Johnson" },
  { uid: "doctor-uid-002", email: "dr.john@medflow.com", name: "Dr. John Smith" },
  { uid: "patient-uid-001", email: "patient@example.com", name: "John Doe" },
  { uid: "patient-uid-002", email: "jane@example.com", name: "Jane Wilson" },
  { uid: "ZEEkeIrS0YZf1nGX7lAfMvdsSAh2", email: "owais.bhat2612@gmail.com", name: "Owais Bhat" },
] as const;

const STORAGE_KEY = "medflow-demo-user";
export const DEMO_AUTH_EVENT = "medflow-demo-auth-changed";

function toUser(account: (typeof DEMO_ACCOUNTS)[number]): DemoUser {
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.name,
    getIdToken: async () => `demo:${account.uid}`,
  };
}

export function isDemoUid(uid: string): boolean {
  return DEMO_ACCOUNTS.some((account) => account.uid === uid);
}

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const uid = window.localStorage.getItem(STORAGE_KEY);
    const account = DEMO_ACCOUNTS.find((candidate) => candidate.uid === uid);
    return account ? toUser(account) : null;
  } catch {
    return null;
  }
}

export async function demoSignIn(email: string, password: string): Promise<DemoUser> {
  const account = DEMO_ACCOUNTS.find(
    (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!account || password !== DEMO_PASSWORD) {
    throw Object.assign(new Error("Invalid demo credentials"), { code: "auth/invalid-credential" });
  }
  window.localStorage.setItem(STORAGE_KEY, account.uid);
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
  return toUser(account);
}

export async function demoSignOut(): Promise<void> {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
}
