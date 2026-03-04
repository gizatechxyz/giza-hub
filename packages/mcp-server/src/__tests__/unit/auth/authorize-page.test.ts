import { describe, test, expect } from 'bun:test';

import { buildPrivyLoginUrl } from '../../../auth/authorize-page.js';

describe('buildPrivyLoginUrl', () => {
  const APP_ID = 'test-app-id';
  const CALLBACK_URL = 'http://localhost:3000/callback';
  const SESSION_ID = 'session-abc-123';

  test('returns URL with correct base', () => {
    const url = buildPrivyLoginUrl(APP_ID, CALLBACK_URL, SESSION_ID);
    expect(url).toStartWith('https://auth.privy.io/login');
  });

  test('contains appId param', () => {
    const url = buildPrivyLoginUrl(APP_ID, CALLBACK_URL, SESSION_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('appId')).toBe(APP_ID);
  });

  test('contains redirectUrl param', () => {
    const url = buildPrivyLoginUrl(APP_ID, CALLBACK_URL, SESSION_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('redirectUrl')).toBe(
      CALLBACK_URL,
    );
  });

  test('contains state param', () => {
    const url = buildPrivyLoginUrl(APP_ID, CALLBACK_URL, SESSION_ID);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('state')).toBe(SESSION_ID);
  });

  test('encodes special characters in params', () => {
    const specialCallback =
      'http://localhost:3000/callback?foo=bar&baz=qux';
    const specialSession = 'session with spaces & symbols=+';
    const url = buildPrivyLoginUrl(
      APP_ID,
      specialCallback,
      specialSession,
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('redirectUrl')).toBe(
      specialCallback,
    );
    expect(parsed.searchParams.get('state')).toBe(specialSession);
  });

  test('returns a valid URL', () => {
    const url = buildPrivyLoginUrl(APP_ID, CALLBACK_URL, SESSION_ID);
    expect(() => new URL(url)).not.toThrow();
  });
});
