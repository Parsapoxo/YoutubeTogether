import { $, esc } from './common.js';
import { initShell } from './shell.js';
import { logout } from './auth.js';
import { loadFriends } from './friends.js';
const me = await initShell('profile.html'); const n = (await loadFriends(me)).filter((f) => f.status === 'accepted').length;
const t = localStorage.getItem('ytt_theme') || 'auto';
$('#pf').innerHTML = `<div class="row"><div class="av" style="background:var(--ac);width:72px;height:72px;font-size:28px">${esc(me.name[0].toUpperCase())}</div><div><h1 style="margin:0">${esc(me.name)}</h1><div class="mu">${n} friends</div></div></div>
<h2>Settings</h2><div class="card cb" style="max-width:560px;cursor:default"><div class="sw">Theme<select class="in" id="theme"><option value="auto" ${t === 'auto' ? 'selected' : ''}>System</option><option value="dark" ${t === 'dark' ? 'selected' : ''}>Dark</option><option value="light" ${t === 'light' ? 'selected' : ''}>Light</option></select></div>
<div class="sw">Account<button class="btn d s" id="out">Log out</button></div></div>`;
$('#theme').onchange = (e) => { const v = e.target.value; if (v === 'auto') { localStorage.removeItem('ytt_theme'); delete document.documentElement.dataset.theme; } else { localStorage.setItem('ytt_theme', v); document.documentElement.dataset.theme = v; } };
$('#out').onclick = async () => { await logout(); localStorage.removeItem('ytt_me'); localStorage.removeItem('ytt_badge'); location.href = 'index.html'; };
