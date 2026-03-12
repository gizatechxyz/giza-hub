import { describe, test, expect } from 'bun:test';

import { buildLoginPageHtml, buildLoginCsp } from '../../../auth/authorize-page';

describe('buildLoginPageHtml', () => {
  const APP_ID = 'test-app-id';
  const CALLBACK_URL = 'http://localhost:3000/callback';
  const STATE = 'session-abc-123';
  const NONCE = 'dGVzdC1ub25jZQ==';

  test('returns HTML with root div', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain('<div id="root"></div>');
  });

  test('contains the appId in config', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain(`"appId":"${APP_ID}"`);
  });

  test('contains the callbackUrl in config', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain(`"callbackUrl":"${CALLBACK_URL}"`);
  });

  test('contains the state in config', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain(`"state":"${STATE}"`);
  });

  test('loads the bundled login entry script with nonce', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain(`<script nonce="${NONCE}" src="/login-entry.js"></script>`);
  });

  test('nonce appears on the inline config script tag', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain(`<script nonce="${NONCE}">window.__GIZA_LOGIN_CONFIG__=`);
  });

  test('nonce appears on both script tags', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    const nonceAttrCount = (html.match(new RegExp(`nonce="${NONCE}"`, 'g')) ?? []).length;
    expect(nonceAttrCount).toBe(2);
  });

  test('escapes < to prevent script injection', () => {
    const maliciousState = '</script><script>alert(1)</script>';
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, maliciousState, NONCE);

    // The config block between the script tags must not contain raw '<'
    const configMatch = html.match(
      /window\.__GIZA_LOGIN_CONFIG__=(.+?);<\/script>/,
    );
    expect(configMatch).toBeTruthy();
    expect(configMatch![1]).not.toContain('</script>');
    expect(configMatch![1]).not.toContain('<');

    // The value should still round-trip correctly through JSON.parse
    const parsed = JSON.parse(configMatch![1]!);
    expect(parsed.state).toBe(maliciousState);
  });

  test('escapes Unicode line separators', () => {
    const stateWithSeparators = `session\u2028line\u2029para`;
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, stateWithSeparators, NONCE);

    const configMatch = html.match(
      /window\.__GIZA_LOGIN_CONFIG__=(.+?);<\/script>/,
    );
    expect(configMatch).toBeTruthy();
    expect(configMatch![1]).not.toContain('\u2028');
    expect(configMatch![1]).not.toContain('\u2029');

    const parsed = JSON.parse(configMatch![1]!);
    expect(parsed.state).toBe(stateWithSeparators);
  });

  test('returns valid HTML document', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
  });
});

describe('buildLoginCsp', () => {
  const NONCE = 'dGVzdC1ub25jZQ==';

  test('includes nonce in script-src directive', () => {
    const csp = buildLoginCsp(NONCE);
    expect(csp).toContain(`script-src 'self' 'nonce-${NONCE}'`);
  });

  test('blocks everything by default', () => {
    const csp = buildLoginCsp(NONCE);
    expect(csp).toContain("default-src 'none'");
  });

  test('allows inline styles', () => {
    const csp = buildLoginCsp(NONCE);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  test('allows connections to Privy', () => {
    const csp = buildLoginCsp(NONCE);
    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://auth.privy.io');
    expect(csp).toContain('https://*.privy.io');
  });

  test('allows frames from Privy', () => {
    const csp = buildLoginCsp(NONCE);
    expect(csp).toContain('frame-src https://auth.privy.io https://*.privy.io');
  });

  test('blocks frame ancestors', () => {
    const csp = buildLoginCsp(NONCE);
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
