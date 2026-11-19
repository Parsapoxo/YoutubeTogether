import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Fixed allow-list: this function never fetches anything the list does not name.
const HANDLES = ['AriaKeoXer', 'KeoxerGame', 'TheUpsideDownByKeoxer', 'Kouman', 'DogmNabash', 'MrBeast'];
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const HDR = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+1; SOCS=CAI' };
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const meta = (html: string, prop: string) => { const m = html.match(new RegExp('<meta property="' + prop + '" content="([^"]*)"')); return m ? decode(m[1]) : ''; };
async function channel(handle: string) {
  try {
    const html = await (await fetch(`https://www.youtube.com/@${handle}`, { headers: HDR })).text();
    const m = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) || html.match(/"externalId":"(UC[\w-]{22})"/) || html.match(/"channelId":"(UC[\w-]{22})"/);
    if (!m) throw new Error('channel id not found');
    const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${m[1]}`, { headers: HDR })).text();
    const videos = xml.split('<entry>').slice(1).map((e) => ({
      id: (e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1],
      title: decode((e.match(/<title>([^<]*)<\/title>/) || [])[1] || ''),
      published: (e.match(/<published>([^<]*)<\/published>/) || [])[1] || '',
    })).filter((v) => v.id);
    return { handle, name: meta(html, 'og:title') || handle, avatar: meta(html, 'og:image'), videos };
  } catch (err) { return { handle, name: handle, avatar: '', videos: [], error: String(err) }; }
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const channels = await Promise.all(HANDLES.map(channel));
  return new Response(JSON.stringify({ channels }), { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' } });
});
