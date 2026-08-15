/**
 * Serves the 陪练本 SPA as HTML.
 * Static assets (JS/CSS/images) live in the public Storage bucket `site`.
 * Browsers hit this function so HTML is not rewritten to text/plain.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl) {
    return new Response('SUPABASE_URL missing', { status: 500 })
  }

  const indexUrl = `${supabaseUrl}/storage/v1/object/public/site/index.html`
  const upstream = await fetch(indexUrl)
  if (!upstream.ok) {
    return new Response(`site bundle not uploaded (${upstream.status})`, {
      status: 503,
    })
  }

  const html = await upstream.text()
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
    },
  })
})
