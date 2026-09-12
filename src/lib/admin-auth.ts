// One server-validated session is shared by the main admin and Connect Ops.
const SESSION_KEY = 'harry_admin_secret';
const ADMIN_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-admin`;

export function isAdminAuthenticated(): boolean {
  return Boolean(sessionStorage.getItem(SESSION_KEY));
}

export function getAdminSecret(): string {
  return sessionStorage.getItem(SESSION_KEY) ?? '';
}

export function saveAdminSession(secret: string): void {
  sessionStorage.setItem(SESSION_KEY, secret);
}

export async function loginAdmin(password: string): Promise<boolean> {
  const secret = password.trim();
  if (!secret) return false;
  try {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'x-admin-key': secret,
      },
      body: JSON.stringify({ action: 'authenticate' }),
    });
    if (!response.ok) return false;
    saveAdminSession(secret);
    return true;
  } catch {
    return false;
  }
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
