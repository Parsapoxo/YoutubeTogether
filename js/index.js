import { $, showVersion, NAME_RE } from './common.js';
import { login, register, getUser } from './auth.js';
showVersion(); if (await getUser()) location.href = 'home.html';
let reg = false;
$('#switch').onclick = () => { reg = !reg; $('#title').textContent = reg ? 'Register' : 'Log in'; $('#go').textContent = reg ? 'Create account' : 'Log in'; $('#switch').textContent = reg ? 'Have an account? Log in' : 'Need an account? Register'; $('#msg').textContent = ''; };
async function submit() {
  const n = $('#user').value.trim().toLowerCase(), p = $('#pass').value; $('#msg').textContent = '';
  try { if (!NAME_RE.test(n)) throw new Error('Username: 3-16 chars, a-z, 0-9, underscore'); await (reg ? register : login)(n, p); location.href = 'home.html'; }
  catch (e) { $('#msg').textContent = e.message; }
}
$('#go').onclick = submit; $('#pass').onkeydown = (e) => e.key === 'Enter' && submit();
