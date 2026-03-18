import { timingSafeEqual } from 'node:crypto';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { provider } from '../../src/auth/provider-singleton';
import { oauthErrorResponse } from '../../src/utils/oauth-response';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function errorJson(
  error: string,
  description: string,
  status = 400,
): Response {
  return oauthErrorResponse(error, description, status, NO_STORE);
}

function tokenResponse(tokens: Record<string, unknown>): Response {
  return Response.json(tokens, { headers: NO_STORE });
}

export async function POST(req: Request): Promise<Response> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return errorJson(
      'invalid_request',
      'Content-Type must be application/x-www-form-urlencoded',
    );
  }

  const form = await req.formData();
  const grantType = form.get('grant_type') as string | null;
  const clientId = form.get('client_id') as string | null;
  const clientSecret = form.get('client_secret') as string | null;

  if (!clientId) {
    return errorJson('invalid_client', 'Missing client_id');
  }

  const client = await provider.clientsStore.getClient(clientId);
  if (!client) {
    return errorJson('invalid_client', 'Unknown client', 401);
  }

  if (client.client_secret) {
    if (!clientSecret) {
      return errorJson('invalid_client', 'Missing client_secret', 401);
    }
    const a = Buffer.from(clientSecret);
    const b = Buffer.from(client.client_secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return errorJson('invalid_client', 'Invalid client_secret', 401);
    }
  }

  if (
    client.client_secret_expires_at &&
    client.client_secret_expires_at > 0 &&
    Math.floor(Date.now() / 1000) > client.client_secret_expires_at
  ) {
    return errorJson('invalid_client', 'Client secret expired', 401);
  }

  if (grantType === 'authorization_code') {
    return handleAuthorizationCode(form, client);
  }

  if (grantType === 'refresh_token') {
    return handleRefreshToken(form, client);
  }

  return errorJson('unsupported_grant_type', `Unsupported grant_type: ${grantType}`);
}

async function handleAuthorizationCode(
  form: FormData,
  client: OAuthClientInformationFull,
): Promise<Response> {
  const code = form.get('code') as string | null;
  const codeVerifier = form.get('code_verifier') as string | null;
  const redirectUri = (form.get('redirect_uri') as string | null) ?? undefined;

  if (!code) {
    return errorJson('invalid_request', 'Missing code');
  }

  if (!codeVerifier) {
    return errorJson('invalid_request', 'Missing code_verifier');
  }

  try {
    const tokens = await provider.verifyPkceAndExchange(
      client,
      code,
      codeVerifier,
      redirectUri,
    );
    return tokenResponse(tokens);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed';
    return errorJson('invalid_grant', message);
  }
}

async function handleRefreshToken(
  form: FormData,
  client: OAuthClientInformationFull,
): Promise<Response> {
  const refreshToken = form.get('refresh_token') as string | null;
  const scope = (form.get('scope') as string | null) ?? undefined;

  if (!refreshToken) {
    return errorJson('invalid_request', 'Missing refresh_token');
  }

  const scopes = scope ? scope.split(' ') : undefined;

  try {
    const tokens = await provider.exchangeRefreshToken(
      client,
      refreshToken,
      scopes,
    );
    return tokenResponse(tokens);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token refresh failed';
    return errorJson('invalid_grant', message);
  }
}
