const PRIVY_AUTH_BASE = 'https://auth.privy.io';

export function buildPrivyLoginUrl(
  privyAppId: string,
  callbackUrl: string,
  sessionId: string,
): string {
  const url = new URL('/login', PRIVY_AUTH_BASE);
  url.searchParams.set('appId', privyAppId);
  url.searchParams.set('redirectUrl', callbackUrl);
  url.searchParams.set('state', sessionId);
  return url.toString();
}
