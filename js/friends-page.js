import { $, esc, toast, av, NAME_RE } from './common.js';
import { initShell } from './shell.js';
import { sb } from './supa.js';
import { loadFriends } from './friends.js';
const me = await initShell('friends.html'); let F = [], tab = 'My friends', q = '';
async function refresh() { F = await loadFriends(me); render(); }
function render() {
  const on = window.online || new Set(), acc = F.filter((f) => f.status === 'accepted'), inc = F.filter((f) => f.incoming), out = F.filter((f) => f.status === 'pending' && !f.incoming);
  $('#tabs').innerHTML = ['My friends', 'Online', 'Pending requests', 'Sent requests'].map((x) => `<button class="${tab === x ? 'on' : ''}" data-t="${x}">${x}${x === 'Pending requests' && inc.length ? ` (${inc.length})` : ''}</button>`).join('');
  const li = (f, st, sub, btn) => `<div class="li">${av(f.name, st)}<div class="g"><b>${esc(f.name)}</b><div class="mu">${sub}</div></div>${btn}</div>`;
  let h;
  if (tab === 'My friends' || tab === 'Online') h = acc.filter((f) => (tab === 'My friends' || on.has(f.id)) && f.name.includes(q)).map((f) => li(f, on.has(f.id) ? 'on' : 'off', on.has(f.id) ? 'Online' : 'Offline', `<button class="btn d s" data-a="rm" data-id="${f.fid}">Remove</button>`)).join('') || '<div class="em">Nobody here yet.</div>';
  else if (tab === 'Pending requests') h = inc.map((f) => li(f, '', 'wants to be friends', `<button class="btn p s" data-a="acc" data-id="${f.fid}">Accept</button><button class="btn s" data-a="rm" data-id="${f.fid}">Reject</button>`)).join('') || '<div class="em">No pending requests.</div>';
  else h = out.map((f) => li(f, '', 'Request sent', `<button class="btn s" data-a="rm" data-id="${f.fid}">Cancel</button>`)).join('') || '<div class="em">No outgoing requests.</div>';
  $('#body').innerHTML = h;
}
$('#tabs').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; render(); } };
$('#fq').oninput = (e) => { q = e.target.value.toLowerCase(); render(); };
$('#body').onclick = async (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  if (b.dataset.a === 'acc') await sb.from('friendships').update({ status: 'accepted' }).eq('id', b.dataset.id);
  else if (confirm('Are you sure?')) await sb.from('friendships').delete().eq('id', b.dataset.id); else return;
  refresh();
};
$('#addbtn').onclick = async () => {
  const n = $('#add').value.trim().toLowerCase(); if (!NAME_RE.test(n) || n === me.name) return toast('Enter a valid username');
  const { data: p } = await sb.from('profiles').select('id').eq('username', n).maybeSingle(); if (!p) return toast('User not found');
  const { error } = await sb.from('friendships').insert({ requester: me.id, addressee: p.id });
  toast(error ? 'Already friends or a request exists' : 'Request sent'); if (!error) { tab = 'Sent requests'; $('#add').value = ''; } refresh();
};
window.addEventListener('ytt-presence', render);
sb.channel('fp-' + me.id).on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refresh).subscribe();
refresh();
