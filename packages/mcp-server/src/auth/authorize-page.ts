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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Giza Login</title>
</head><body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__GIZA_LOGIN_CONFIG__=${config};</script>
  <script nonce="${nonce}" src="/public/login-entry.js"></script>
</body></html>`;
}
