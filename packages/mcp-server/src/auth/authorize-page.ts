function htmlHead(title: string): string {
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="hsl(224,71%,4%)">
  <title>${title}</title>
  <link rel="stylesheet" href="/login.css">`;
}

export function buildLoginCsp(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://auth.privy.io https://*.privy.io",
    "frame-src https://auth.privy.io https://*.privy.io",
    "img-src 'self' https: data:",
    "font-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function buildLoginPageHtml(
  privyAppId: string,
  callbackUrl: string,
  state: string,
  nonce: string,
): string {
  const config = JSON.stringify({ appId: privyAppId, callbackUrl, state })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `<!DOCTYPE html>
<html><head>
  ${htmlHead('Giza Login')}
</head><body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__GIZA_LOGIN_CONFIG__=${config};</script>
  <script nonce="${nonce}" src="/login-entry.js"></script>
</body></html>`;
}

export const SUCCESS_PAGE_HTML = `<!DOCTYPE html>
<html><head>
  ${htmlHead('Giza - Authenticated')}
</head><body>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="mx-auto max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg animate-fade-in text-center">
      <svg class="mx-auto h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-5" />
      </svg>
      <h2 class="mt-4 text-lg font-semibold text-card-foreground">Authenticated</h2>
      <p class="mt-2 text-sm text-muted-foreground">You can close this tab and return to your terminal.</p>
    </div>
  </div>
</body></html>`;

export const SUCCESS_CSP = "default-src 'none'; style-src 'self'";
