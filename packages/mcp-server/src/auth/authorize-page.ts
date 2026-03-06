export function buildLoginPageHtml(
  privyAppId: string,
  callbackUrl: string,
  state: string,
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
  <script>window.__GIZA_LOGIN_CONFIG__=${config};</script>
  <script src="/public/login-entry.js"></script>
</body></html>`;
}
