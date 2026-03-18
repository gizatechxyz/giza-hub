import { describe, test, expect } from 'bun:test';

import {
  buildLoginPageHtml,
  buildLoginCsp,
  buildSuccessPageHtml,
  buildSuccessCsp,
} from '../../../auth/authorize-page';

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

  test('links to login.css stylesheet', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain('<link rel="stylesheet" href="/login.css">');
  });

  test('contains dark color-scheme meta tag', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE, NONCE);
    expect(html).toContain('<meta name="color-scheme" content="dark">');
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

describe('buildSuccessPageHtml', () => {
  const REDIRECT_URL = 'http://localhost:9999/oauth/callback?code=abc&state=xyz';

  test('returns valid HTML document', () => {
    const html = buildSuccessPageHtml(REDIRECT_URL);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  test('contains Authenticated text', () => {
    const html = buildSuccessPageHtml(REDIRECT_URL);
    expect(html).toContain('Authenticated');
  });

  test('uses inline styles instead of external stylesheet', () => {
    const html = buildSuccessPageHtml(REDIRECT_URL);
    expect(html).toContain('<style>');
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  test('includes hidden iframe with redirect URL', () => {
    const html = buildSuccessPageHtml(REDIRECT_URL);
    expect(html).toContain('<iframe');
    expect(html).toContain('style="display:none"');
    expect(html).toContain('http://localhost:9999/oauth/callback?code=abc&amp;state=xyz');
  });

  test('escapes HTML entities in redirect URL', () => {
    const url = 'http://localhost/cb?a=1&b=2"onclick="alert(1)';
    const html = buildSuccessPageHtml(url);
    expect(html).not.toContain('&b=2"onclick');
    expect(html).toContain('&amp;b=2&quot;onclick');
  });

  test('rejects javascript: scheme', () => {
    expect(() => buildSuccessPageHtml('javascript:alert(1)')).toThrow(
      'Redirect URI has disallowed scheme',
    );
  });

  test('rejects data: scheme', () => {
    expect(() => buildSuccessPageHtml('data:text/html,<h1>hi</h1>')).toThrow(
      'Redirect URI has disallowed scheme',
    );
  });
});

describe('buildSuccessCsp', () => {
  test('returns minimal CSP allowing inline styles', () => {
    const csp = buildSuccessCsp('https://example.com/cb?code=abc');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("style-src 'unsafe-inline'");
  });

  test('scopes frame-src to redirect origin', () => {
    const csp = buildSuccessCsp('https://example.com/cb?code=abc');
    expect(csp).toContain('frame-src https://example.com');
    expect(csp).not.toContain('http:');
  });

  test('uses localhost origin for localhost redirects', () => {
    const csp = buildSuccessCsp('http://localhost:9999/oauth/callback?code=abc');
    expect(csp).toContain('frame-src http://localhost:9999');
  });
});
