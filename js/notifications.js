import { $, esc, av } from './common.js';
import { initShell } from './shell.js';
import { sb } from './supa.js';
import { loadFriends } from './friends.js';
const me = await initShell('notifications.html');
async function load() {
  const F = await loadFriends(me), name = (id) => (F.find((f) => f.id === id) || {}).name || 'A friend';
  const { data } = await sb.from('invites').select('id,code,from_user,created_at').eq('to_user', me.id).gte('created_at', new Date(Date.now() - 36e5).toISOString()).order('created_at', { ascending: false });
  const reqs = F.filter((f) => f.incoming).map((f) => `<div class="li un">${av(f.name)}<div class="g"><b>${esc(f.name)}</b> sent you a friend request</div><button class="btn p s" data-a="acc" data-id="${f.fid}">Accept</button><button class="btn s" data-a="rm" data-id="${f.fid}">Decline</button></div>`);
  const inv = (data || []).map((i) => `<div class="li un">${av(name(i.from_user))}<div class="g"><b>${esc(name(i.from_user))}</b> invited you to room <b>${esc(i.code)}</b><div class="mu">Invitations expire after 1 hour</div></div><button class="btn p s" data-a="join" data-id="${i.id}" data-code="${esc(i.code)}">Join room</button><button class="btn s" data-a="dis" data-id="${i.id}">Dismiss</button></div>`);
  $('#body').innerHTML = [...inv, ...reqs].join('') || '<div class="em">You’re all caught up.</div>';
}
$('#body').onclick = async (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return; const id = b.dataset.id, a = b.dataset.a;
  if (a === 'acc') await sb.from('friendships').update({ status: 'accepted' }).eq('id', id);
  else if (a === 'rm') await sb.from('friendships').delete().eq('id', id);
  else { await sb.from('invites').delete().eq('id', id); if (a === 'join') return (location.href = 'room.html?code=' + b.dataset.code); }
  load();
};
sb.channel('np-' + me.id)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: 'to_user=eq.' + me.id }, load)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, load).subscribe();
load();
