import { describe, test, expect } from 'bun:test';

import { buildLoginPageHtml } from '../../../auth/authorize-page.js';

describe('buildLoginPageHtml', () => {
  const APP_ID = 'test-app-id';
  const CALLBACK_URL = 'http://localhost:3000/callback';
  const STATE = 'session-abc-123';

  test('returns HTML with root div', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE);
    expect(html).toContain('<div id="root"></div>');
  });

  test('contains the appId in config', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE);
    expect(html).toContain(`"appId":"${APP_ID}"`);
  });

  test('contains the callbackUrl in config', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE);
    expect(html).toContain(`"callbackUrl":"${CALLBACK_URL}"`);
  });

  test('contains the state in config', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE);
    expect(html).toContain(`"state":"${STATE}"`);
  });

  test('loads the bundled login entry script', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE);
    expect(html).toContain('<script src="/public/login-entry.js"></script>');
  });

  test('escapes < to prevent script injection', () => {
    const maliciousState = '</script><script>alert(1)</script>';
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, maliciousState);

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

  test('returns valid HTML document', () => {
    const html = buildLoginPageHtml(APP_ID, CALLBACK_URL, STATE);
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
  });
});
