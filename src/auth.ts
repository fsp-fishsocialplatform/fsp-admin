// Token persistence. The admin session token (issued by POST /admin/login) is
// kept in localStorage so a refresh doesn't log the operator out. It's the same
// bearer token the backend's session table issues; there's no refresh token, so
// when it expires the API layer just bounces back to /login.

const TOKEN_KEY = 'fsp_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthed(): boolean {
  return !!getToken();
}
