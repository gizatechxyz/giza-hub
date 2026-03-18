import { provider } from '../../src/auth/provider-singleton';
import { oauthErrorResponse } from '../../src/utils/oauth-response';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const responseType = url.searchParams.get('response_type');
  const codeChallenge = url.searchParams.get('code_challenge');
  const codeChallengeMethod = url.searchParams.get('code_challenge_method');
  const state = url.searchParams.get('state') ?? undefined;
  const scope = url.searchParams.get('scope') ?? undefined;

  if (!clientId) {
    return oauthErrorResponse('invalid_request', 'Missing client_id');
  }

  const client = await provider.clientsStore.getClient(clientId);
  if (!client) {
    return oauthErrorResponse('invalid_request', 'Unknown client_id');
  }

  if (!redirectUri) {
    return oauthErrorResponse('invalid_request', 'Missing redirect_uri');
  }

  if (!client.redirect_uris.includes(redirectUri)) {
    return oauthErrorResponse('invalid_request', 'redirect_uri not registered for this client');
  }

  if (responseType !== 'code') {
    return oauthErrorResponse('unsupported_response_type', 'Only response_type=code is supported');
  }

  if (!codeChallenge) {
    return oauthErrorResponse('invalid_request', 'Missing code_challenge');
  }

  if (codeChallengeMethod !== 'S256') {
    return oauthErrorResponse('invalid_request', 'Only code_challenge_method=S256 is supported');
  }

  const scopes = scope ? scope.split(' ') : undefined;

  const result = await provider.authorize(client, {
    state,
    scopes,
    codeChallenge,
    redirectUri,
  });

  return new Response(result.html, {
    headers: {
      ...result.headers,
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  });
}
