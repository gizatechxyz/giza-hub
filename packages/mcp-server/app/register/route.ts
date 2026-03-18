import { OAuthClientMetadataSchema } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { provider } from '../../src/auth/provider-singleton';
import { oauthErrorResponse } from '../../src/utils/oauth-response';

export async function POST(req: Request): Promise<Response> {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return oauthErrorResponse(
      'invalid_client_metadata',
      'Content-Type must be application/json',
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return oauthErrorResponse(
      'invalid_client_metadata',
      'Request body must be valid JSON',
    );
  }

  const parsed = OAuthClientMetadataSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => i.message)
      .join('; ');
    return oauthErrorResponse('invalid_client_metadata', message);
  }

  const metadata = parsed.data;
  const isPublic =
    !metadata.token_endpoint_auth_method ||
    metadata.token_endpoint_auth_method === 'none';

  const fullClient: OAuthClientInformationFull = {
    ...metadata,
    client_id: crypto.randomUUID(),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    ...(isPublic
      ? {}
      : {
          client_secret: crypto.randomUUID().replace(/-/g, '') +
            crypto.randomUUID().replace(/-/g, ''),
          client_secret_expires_at: 0,
        }),
  };

  const registered = await provider.clientsStore.registerClient!(fullClient);
  return Response.json(registered, { status: 201 });
}
