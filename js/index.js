import { $, showVersion, NAME_RE } from './common.js';
import { login, register, getUser } from './auth.js';
showVersion(); function go() { const n = sessionStorage.getItem('ytt_next'); sessionStorage.removeItem('ytt_next'); location.href = n && /^[\w.-]+\.html(\?[\w=&-]*)?$/.test(n) ? n : 'home.html'; }
if (await getUser()) go();
let reg = false;
$('#switch').onclick = () => { reg = !reg; $('#title').textContent = reg ? 'Register' : 'Log in'; $('#go').textContent = reg ? 'Create account' : 'Log in'; $('#switch').textContent = reg ? 'Have an account? Log in' : 'Need an account? Register'; $('#msg').textContent = ''; };
async function submit() {
  const n = $('#user').value.trim().toLowerCase(), p = $('#pass').value; $('#msg').textContent = '';
  try { if (!NAME_RE.test(n)) throw new Error('Username: 3-16 chars, a-z, 0-9, underscore'); await (reg ? register : login)(n, p); go(); }
  catch (e) { $('#msg').textContent = e.message; }
}
$('#go').onclick = submit; $('#pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
