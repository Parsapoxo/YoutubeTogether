const U = 'ytt_users', S = 'ytt_session', D = 'ytt_data_';
const users = () => JSON.parse(localStorage.getItem(U) || '{}');
async function hash(pw, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, k, 256);
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function register(name, pw) {
  const u = users(); if (u[name]) throw new Error('Username already exists on this device');
  if (pw.length < 6) throw new Error('Password must be at least 6 characters');
  const salt = crypto.randomUUID(); u[name] = { salt, hash: await hash(pw, salt) };
  localStorage.setItem(U, JSON.stringify(u)); localStorage.setItem(S, name);
}
export async function login(name, pw) {
  const a = users()[name];
  if (!a || a.hash !== (await hash(pw, a.salt))) throw new Error('Invalid username or password');
  localStorage.setItem(S, name);
}
export const currentUser = () => localStorage.getItem(S);
export const logout = () => localStorage.removeItem(S);
export function requireUser() { const u = currentUser(); if (!u) location.href = 'index.html'; return u; }
export const loadData = (n) => JSON.parse(localStorage.getItem(D + n) || '{"friends":{}}');
export const saveData = (n, d) => localStorage.setItem(D + n, JSON.stringify(d));
