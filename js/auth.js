import { sb } from './supa.js';
import { EMAIL_DOMAIN } from './config.js';
const email = (n) => `${n}@${EMAIL_DOMAIN}`;
export async function register(name, password) {
  const { data, error } = await sb.auth.signUp({ email: email(name), password, options: { data: { username: name } } });
  if (error) throw new Error(/registered|database/i.test(error.message) ? 'Username already taken' : error.message);
  if (!data.session) throw new Error('Email confirmation is still enabled in Supabase');
}
export async function login(name, password) {
  const { error } = await sb.auth.signInWithPassword({ email: email(name), password });
  if (error) throw new Error(/invalid/i.test(error.message) ? 'Invalid username or password' : error.message);
}
export async function getUser() {
  const { data } = await sb.auth.getSession(); const u = data.session && data.session.user;
  return u ? { id: u.id, name: u.user_metadata.username } : null;
}
export async function requireUser() {
  const u = await getUser();
  if (!u) { sessionStorage.setItem('ytt_next', location.pathname.split('/').pop() + location.search); location.href = 'index.html'; }
  return u;
}
export const logout = () => sb.auth.signOut();
