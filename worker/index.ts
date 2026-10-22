interface AssetEnvironment { ASSETS: { fetch(request: Request): Promise<Response> } }
export default {
  async fetch(request: Request, env: AssetEnvironment): Promise<Response> {
    const response = await env.ASSETS.fetch(request)
    // SPA fallback must never become an immutable JavaScript/CSS response.
    if (new URL(request.url).pathname.startsWith('/assets/') &&
        (response.status === 404 || /^text\/html\b/i.test(response.headers.get('content-type') || ''))) {
      return new Response(request.method === 'HEAD' ? null : 'Arquivo desta versão indisponível.', {
        status: 404,
        headers: {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},
      })
    }
    return response
  },
}
