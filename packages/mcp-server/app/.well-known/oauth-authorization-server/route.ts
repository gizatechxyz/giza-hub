import { getBaseUrl, SUPPORTED_SCOPES } from '../../../src/constants';

export function GET(): Response {
  const baseUrl = getBaseUrl();

  return Response.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/authorize`,
    token_endpoint: `${baseUrl}/token`,
    registration_endpoint: `${baseUrl}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    scopes_supported: [...SUPPORTED_SCOPES],
  });
}
