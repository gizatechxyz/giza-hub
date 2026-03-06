import React, { useEffect, useRef, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

declare global {
  interface Window {
    __GIZA_LOGIN_CONFIG__: {
      appId: string;
      callbackUrl: string;
      state: string;
    };
  }
}

function LoginInner(): React.ReactElement {
  const { ready, authenticated, login, getAccessToken } = usePrivy();
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const loginTriggered = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!ready) return;

    if (authenticated) {
      setStatus('Retrieving access token...');
      getAccessToken()
        .then((token) => {
          if (!mounted) return;
          if (!token) {
            setError('Failed to retrieve access token.');
            return;
          }
          const { callbackUrl, state } = window.__GIZA_LOGIN_CONFIG__;
          const url = new URL(callbackUrl);
          url.searchParams.set('privy_token', token);
          url.searchParams.set('state', state);
          setStatus('Redirecting...');
          window.location.href = url.toString();
        })
        .catch((err: unknown) => {
          if (!mounted) return;
          const msg =
            err instanceof Error ? err.message : 'Unknown error';
          setError(`Token retrieval failed: ${msg}`);
        });
      return () => { mounted = false; };
    }

    if (!loginTriggered.current) {
      loginTriggered.current = true;
      setStatus('Connecting to wallet...');
      try {
        login();
      } catch (err: unknown) {
        if (!mounted) return;
        loginTriggered.current = false;
        const msg =
          err instanceof Error ? err.message : 'Wallet login failed';
        setError(msg);
      }
    }

    return () => { mounted = false; };
  }, [ready, authenticated, login, getAccessToken]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20vh' }}>
        <h2>Login Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20vh' }}>
      <h2>Giza Login</h2>
      <p>{status}</p>
    </div>
  );
}

interface LoginPageProps {
  appId: string;
}

export function LoginPage({ appId }: LoginPageProps): React.ReactElement {
  return (
    <PrivyProvider
      appId={appId}
      config={{ loginMethods: ['wallet'] }}
    >
      <LoginInner />
    </PrivyProvider>
  );
}
