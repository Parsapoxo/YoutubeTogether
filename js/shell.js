import { $, showVersion, toast, av, esc } from './common.js';
import { requireUser } from './auth.js';
import { sb } from './supa.js';
import { trackOnline } from './friends.js';
export async function initShell(active) {
  const me = await requireUser(); showVersion();
  const html = av(me.name, 'on') + `<div><b>${esc(me.name)}</b></div>`; $('#meblock').innerHTML = html;
  try { localStorage.setItem('ytt_me', html); } catch (e) {}
  const badge = async () => {
    const a = await sb.from('friendships').select('id', { count: 'exact', head: true }).eq('addressee', me.id).eq('status', 'pending');
    const b = await sb.from('invites').select('id', { count: 'exact', head: true }).eq('to_user', me.id).gte('created_at', new Date(Date.now() - 36e5).toISOString());
    const n = (a.count || 0) + (b.count || 0); document.querySelectorAll('.bdg').forEach((e) => { e.hidden = !n; e.textContent = n; }); try { localStorage.setItem('ytt_badge', n); } catch (e) {}
  };
  badge();
  sb.channel('shell-' + me.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invites', filter: 'to_user=eq.' + me.id }, () => { toast('You got a room invite', { href: 'notifications.html', text: 'View' }); badge(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, badge).subscribe();
  trackOnline(me, (s) => { window.online = s; window.dispatchEvent(new Event('ytt-presence')); });
  return me;
}
