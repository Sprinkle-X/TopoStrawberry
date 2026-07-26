const securityHeaders = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "font-src 'self' https://cdn.jsdelivr.net data:",
        "img-src 'self' data:",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; '),
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/') {
            url.pathname = '/index.html';
        }

        const assetResponse = await env.ASSETS.fetch(new Request(url, request));
        const headers = new Headers(assetResponse.headers);

        Object.entries(securityHeaders).forEach(([name, value]) => {
            headers.set(name, value);
        });

        if (url.pathname === '/index.html') {
            headers.set('Cache-Control', 'no-cache');
        }

        return new Response(assetResponse.body, {
            status: assetResponse.status,
            statusText: assetResponse.statusText,
            headers,
        });
    },
};
