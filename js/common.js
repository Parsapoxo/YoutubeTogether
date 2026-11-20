import { APP_VERSION } from './version.js';
const th = localStorage.getItem('ytt_theme'); if (th) document.documentElement.dataset.theme = th;
export const $ = (s) => document.querySelector(s);
export const NAME_RE = /^[a-z0-9_]{3,16}$/;
export function showVersion() { const d = document.createElement('div'); d.className = 'ver'; d.textContent = 'v' + APP_VERSION; document.body.appendChild(d); }
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PAL = ['#8b7bff', '#38bdf8', '#ff6b8a', '#f59e0b', '#34d399', '#a78bfa', '#fb7185'];
export function av(n, st = '') { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % PAL.length; return `<div class="av ${st}" style="background:${PAL[h]}">${esc((n[0] || '?').toUpperCase())}</div>`; }
export function toast(msg, link) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = esc(msg) + (link ? ` <a href="${link.href}">${esc(link.text)}</a>` : ''); t.style.display = 'block';
  clearTimeout(toast.i); toast.i = setTimeout(() => (t.style.display = 'none'), link ? 8000 : 2500);
}
export function randomCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
export function parseYouTubeId(input) {
  input = (input || '').trim(); if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const u = new URL(/^https?:/.test(input) ? input : 'https://' + input), h = u.hostname.replace(/^(www|m)\./, '');
    if (h === 'youtu.be') return u.pathname.slice(1, 12);
    if (h.endsWith('youtube.com')) { if (u.searchParams.get('v')) return u.searchParams.get('v'); const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/); if (m) return m[2]; }
  } catch (e) {}
  return null;
}
