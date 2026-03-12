import { buildLoginPageHtml, buildLoginCsp } from '../../../src/auth/authorize-page';
import { createDeviceSession } from '../../../src/auth/session-auth-store';
import {
  ENV_PRIVY_APP_ID,
  DEVICE_STATE_PREFIX,
  getBaseUrl,
} from '../../../src/constants';

export function GET(req: Request): Response {
  const url = new URL(req.url);
  const mcpSessionId = url.searchParams.get('session');

  if (!mcpSessionId) {
    return Response.json(
      { error: 'Missing session parameter' },
      { status: 400 },
    );
  }

  const privyAppId = process.env[ENV_PRIVY_APP_ID];
  if (!privyAppId) {
    return Response.json(
      { error: 'Server misconfigured' },
      { status: 500 },
    );
  }

  createDeviceSession(mcpSessionId);

  const nonce = crypto.randomUUID();
  const baseUrl = getBaseUrl();
  const callbackUrl = `${baseUrl}/api/authorize/callback`;
  const state = `${DEVICE_STATE_PREFIX}${mcpSessionId}`;

  const html = buildLoginPageHtml(privyAppId, callbackUrl, state, nonce);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Security-Policy': buildLoginCsp(nonce),
    },
  });
}
