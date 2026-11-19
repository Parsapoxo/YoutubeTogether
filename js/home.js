import { $, showVersion, toast, esc, randomCode, NAME_RE } from './common.js';
import { requireUser, logout } from './auth.js';
import { sb } from './supa.js';
import { loadFriends, trackOnline } from './friends.js';
showVersion(); const me = await requireUser(); $('#me').textContent = me.name;
let friends = [], online = new Set();
$('#logout').onclick = async () => { await logout(); location.href = 'index.html'; };
$('#create').onclick = async () => {
  for (let i = 0; i < 5; i++) { const code = randomCode(); const { error } = await sb.from('rooms').insert({ code, host: me.id }); if (!error) return (location.href = 'room.html?code=' + code); }
  toast('Could not create a room');
};
$('#join').onclick = async () => {
  const c = $('#code').value.trim().toUpperCase(); const { data } = await sb.from('rooms').select('code').eq('code', c).maybeSingle();
  data ? (location.href = 'room.html?code=' + c) : toast('Room not found');
};
function render() {
  $('#list').innerHTML = friends.length ? friends.map((f) => {
    const act = f.incoming ? `<span><button data-a="acc" data-id="${f.fid}">Accept</button> <button class="ghost" data-a="rm" data-id="${f.fid}">Decline</button></span>`
      : `<span>${f.status === 'pending' ? '<span class="mut">Pending </span>' : ''}<button class="ghost" data-a="rm" data-id="${f.fid}">${f.status === 'pending' ? 'Cancel' : 'Remove'}</button></span>`;
    return `<div class="item"><span><span class="dot ${online.has(f.id) ? 'on' : ''}"></span>${esc(f.name)} ${f.incoming ? '<span class="mut">(wants to be friends)</span>' : ''}</span>${act}</div>`;
  }).join('') : '<p class="mut">No friends yet.</p>';
}
async function refresh() { friends = await loadFriends(me); render(); loadInvites(); }
async function loadInvites() {
  const since = new Date(Date.now() - 36e5).toISOString();
  const { data } = await sb.from('invites').select('id,code,from_user').eq('to_user', me.id).gte('created_at', since); const inv = data || [];
  $('#invcard').hidden = !inv.length;
  $('#invites').innerHTML = inv.map((i) => `<div class="item"><span>${esc((friends.find((f) => f.id === i.from_user) || {}).name || 'A friend')} invited you to room <b>${esc(i.code)}</b></span><span><button data-a="join" data-id="${i.id}" data-code="${esc(i.code)}">Join</button> <button class="ghost" data-a="dis" data-id="${i.id}">Dismiss</button></span></div>`).join('');
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-a]'); if (!b) return; const id = b.dataset.id;
  if (b.dataset.a === 'acc') await sb.from('friendships').update({ status: 'accepted' }).eq('id', id);
  else if (b.dataset.a === 'rm') { if (!confirm('Are you sure?')) return; await sb.from('friendships').delete().eq('id', id); }
  else { await sb.from('invites').delete().eq('id', id); if (b.dataset.a === 'join') return (location.href = 'room.html?code=' + b.dataset.code); }
  refresh();
});
$('#add').onclick = async () => {
  const n = $('#fname').value.trim().toLowerCase(); if (!NAME_RE.test(n) || n === me.name) return toast('Enter a valid username');
  const { data: p } = await sb.from('profiles').select('id').eq('username', n).maybeSingle(); if (!p) return toast('User not found');
  const { error } = await sb.from('friendships').insert({ requester: me.id, addressee: p.id });
  toast(error ? 'Already friends or a request exists' : 'Request sent'); $('#fname').value = ''; refresh();
};
sb.channel('db-' + me.id)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refresh)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: 'to_user=eq.' + me.id }, () => { toast('You got a room invite'); refresh(); })
  .subscribe();
trackOnline(me, (s) => { online = s; render(); });
refresh();
const jc = new URLSearchParams(location.search).get('join'); if (jc) location.href = 'room.html?code=' + jc.toUpperCase();

// ---- Random video picks from the YouTubers list (edge function yt-feed) ----
let all = [];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
async function loadFeed() {
  try { const c = JSON.parse(sessionStorage.getItem('ytt_feed') || 'null'); if (c && Date.now() - c.t < 6e5) return c.d; } catch (e) {}
  const { data, error } = await sb.functions.invoke('yt-feed'); if (error || !data) throw new Error((error && error.message) || 'No data');
  try { sessionStorage.setItem('ytt_feed', JSON.stringify({ t: Date.now(), d: data.channels })); } catch (e) {}
  return data.channels;
}
function showVideos() {
  const pick = shuffle(all.flatMap((c) => shuffle(c.videos.filter((v) => /^[\w-]{11}$/.test(v.id)).map((v) => ({ ...v, ch: c.name, av: c.avatar }))).slice(0, 2))).slice(0, 12);
  $('#vstatus').textContent = pick.length ? '' : 'No videos could be loaded right now.';
  $('#vids').innerHTML = pick.map((v) => `<article class="vid" data-v="${v.id}"><div class="th"><img loading="lazy" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt=""><span class="play">▶</span></div><div class="meta">${v.av ? `<img class="av" src="${esc(v.av)}" alt="">` : ''}<div><p class="t">${esc(v.title)}</p><p class="c">${esc(v.ch)}</p></div></div></article>`).join('');
}
$('#shuffle').onclick = showVideos;
$('#vids').onclick = async (e) => {
  const c = e.target.closest('[data-v]'); if (!c || c.dataset.busy) return; c.dataset.busy = '1';
  for (let i = 0; i < 5; i++) {
    const code = randomCode(); const { error } = await sb.from('rooms').insert({ code, host: me.id, video_id: c.dataset.v, time: 0, playing: false, ts: Date.now() });
    if (!error) return (location.href = 'room.html?code=' + code);
  }
  toast('Could not create a room'); delete c.dataset.busy;
};
try { all = await loadFeed(); showVideos(); } catch (e) { $('#vstatus').textContent = 'Could not load videos: ' + e.message; }
