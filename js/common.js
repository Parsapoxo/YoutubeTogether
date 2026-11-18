import { APP_VERSION } from './version.js';
export const $ = (s) => document.querySelector(s);
export const NAME_RE = /^[a-z0-9_]{3,16}$/;
export function showVersion() {
  const d = document.createElement('div'); d.className = 'ver'; d.textContent = 'v' + APP_VERSION; document.body.appendChild(d);
}
export function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function toast(msg, link) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${esc(msg)}</span>`;
  if (link) { const a = document.createElement('a'); a.href = link.href; a.textContent = link.text; t.appendChild(a); }
  document.body.appendChild(t); setTimeout(() => t.remove(), link ? 15000 : 3500);
}
export function randomCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
export function parseYouTubeId(input) {
  input = (input || '').trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const u = new URL(input), h = u.hostname.replace('www.', '').replace('m.', '');
    if (h === 'youtu.be') return u.pathname.slice(1, 12);
    if (h.endsWith('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/); if (m) return m[2];
    }
  } catch (e) {}
  return null;
}
