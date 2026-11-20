import { $, showVersion, toast, av, esc } from './common.js';
import { requireUser } from './auth.js';
import { sb } from './supa.js';
import { trackOnline } from './friends.js';
const NAV = [['home.html', 'Home', '⌂'], ['my-rooms.html', 'My rooms', '▣'], ['friends.html', 'Friends', '☺'], ['notifications.html', 'Notifications', '🔔']];
const PROFILE = ['profile.html', 'Profile', '●']; // sidebar reaches it via the user block; mobile tab bar shows it as a tab
export async function initShell(active) {
  const me = await requireUser(); showVersion();
  const link = ([h, l, i], c) => `<a class="${c}${h === active ? ' on' : ''}" href="${h}"><span>${i}</span>${l}${h === 'notifications.html' ? '<span class="bd bdg" hidden></span>' : ''}</a>`;
  $('#nav').innerHTML = `<div class="logo">Youtube<i>Together</i></div>${NAV.map((n) => link(n, 'nb')).join('')}<a class="me nb${active === 'profile.html' ? ' on' : ''}" href="profile.html">${av(me.name, 'on')}<div><b>${esc(me.name)}</b></div></a>`;
  $('#bt').innerHTML = [...NAV, PROFILE].map((n) => link(n, '')).join('');
  const badge = async () => {
    const a = await sb.from('friendships').select('id', { count: 'exact', head: true }).eq('addressee', me.id).eq('status', 'pending');
    const b = await sb.from('invites').select('id', { count: 'exact', head: true }).eq('to_user', me.id).gte('created_at', new Date(Date.now() - 36e5).toISOString());
    const n = (a.count || 0) + (b.count || 0); document.querySelectorAll('.bdg').forEach((e) => { e.hidden = !n; e.textContent = n; });
  };
  badge();
  sb.channel('shell-' + me.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: 'to_user=eq.' + me.id }, () => { toast('You got a room invite', { href: 'notifications.html', text: 'View' }); badge(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, badge).subscribe();
  trackOnline(me, (s) => { window.online = s; window.dispatchEvent(new Event('ytt-presence')); });
  return me;
}
