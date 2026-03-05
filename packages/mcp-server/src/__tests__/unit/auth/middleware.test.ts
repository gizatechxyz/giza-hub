import { describe, test, expect, mock, beforeEach } from 'bun:test';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { OAuthTokenVerifier } from '@modelcontextprotocol/sdk/server/auth/provider.js';

import { optionalBearerAuth } from '../../../auth/middleware.js';
import { buildAuthInfo } from '../../helpers/mock-auth.js';

const TEST_RESOURCE_METADATA_URL =
  'https://example.com/.well-known/oauth-protected-resource';

function createMockReq(headers: Record<string, string> = {}) {
  return { headers, auth: undefined } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = mock((code: number) => res);
  res.set = mock((key: string, value: string) => res);
  res.json = mock((body: any) => res);
  return res;
}

function createMockVerifier(
  result?: AuthInfo,
  error?: Error,
): OAuthTokenVerifier {
  return {
    verifyAccessToken: error
      ? mock(() => Promise.reject(error))
      : mock(() => Promise.resolve(result!)),
  } as OAuthTokenVerifier;
}

describe('optionalBearerAuth', () => {
  let next: ReturnType<typeof mock>;

  beforeEach(() => {
    next = mock(() => {});
  });

  test('calls next with req.auth undefined when no header', async () => {
    const req = createMockReq();
    const res = createMockRes();
    const verifier = createMockVerifier(buildAuthInfo());
    const handler = optionalBearerAuth(verifier, TEST_RESOURCE_METADATA_URL);

    await handler(req, res, next);

    expect(req.auth).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('sets req.auth and calls next for valid Bearer token', async () => {
    const authInfo = buildAuthInfo();
    const req = createMockReq({ authorization: 'Bearer valid-token' });
    const res = createMockRes();
    const verifier = createMockVerifier(authInfo);
    const handler = optionalBearerAuth(verifier, TEST_RESOURCE_METADATA_URL);

    await handler(req, res, next);

    expect(verifier.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(req.auth).toEqual(authInfo);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 with WWW-Authenticate for malformed header', async () => {
    const req = createMockReq({ authorization: 'Basic abc123' });
    const res = createMockRes();
    const verifier = createMockVerifier(buildAuthInfo());
    const handler = optionalBearerAuth(verifier, TEST_RESOURCE_METADATA_URL);

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.set).toHaveBeenCalledWith(
      'WWW-Authenticate',
      `Bearer resource_metadata="${TEST_RESOURCE_METADATA_URL}"`,
    );
    expect(res.json).toHaveBeenCalledWith({
      error: 'Malformed Authorization header',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for "Bearer" with no token', async () => {
    const req = createMockReq({ authorization: 'Bearer ' });
    const res = createMockRes();
    const verifier = createMockVerifier(buildAuthInfo());
    const handler = optionalBearerAuth(verifier, TEST_RESOURCE_METADATA_URL);

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 with WWW-Authenticate when verifier throws', async () => {
    const req = createMockReq({
      authorization: 'Bearer expired-token',
    });
    const res = createMockRes();
    const verifier = createMockVerifier(
      undefined,
      new Error('Token expired'),
    );
    const handler = optionalBearerAuth(verifier, TEST_RESOURCE_METADATA_URL);

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.set).toHaveBeenCalledWith(
      'WWW-Authenticate',
      `Bearer resource_metadata="${TEST_RESOURCE_METADATA_URL}"`,
    );
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid or expired access token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('handles case-insensitive Bearer prefix', async () => {
    const authInfo = buildAuthInfo();
    const req = createMockReq({ authorization: 'bearer my-token' });
    const res = createMockRes();
    const verifier = createMockVerifier(authInfo);
    const handler = optionalBearerAuth(verifier, TEST_RESOURCE_METADATA_URL);

    await handler(req, res, next);

    expect(verifier.verifyAccessToken).toHaveBeenCalledWith('my-token');
    expect(req.auth).toEqual(authInfo);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
