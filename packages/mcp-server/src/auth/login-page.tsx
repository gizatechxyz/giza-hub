import React, { useEffect, useRef, useState } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

const CARD_CLASSES =
  'mx-auto max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg animate-fade-in text-center';

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
  const submitted = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!ready) return;

    if (authenticated) {
      setStatus('Retrieving access token...');
      getAccessToken()
        .then((token) => {
          if (!mounted || submitted.current) return;
          if (!token) {
            setError('Failed to retrieve access token.');
            return;
          }
          submitted.current = true;
          const { callbackUrl, state } = window.__GIZA_LOGIN_CONFIG__;
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = callbackUrl;

          const tokenInput = document.createElement('input');
          tokenInput.type = 'hidden';
          tokenInput.name = 'privy_token';
          tokenInput.value = token;
          form.appendChild(tokenInput);

          const stateInput = document.createElement('input');
          stateInput.type = 'hidden';
          stateInput.name = 'state';
          stateInput.value = state;
          form.appendChild(stateInput);

          document.body.appendChild(form);
          setStatus('Redirecting...');
          form.submit();
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className={CARD_CLASSES}>
        {error ? (
          <>
            <h2 className="text-lg font-semibold text-card-foreground">
              Login Error
            </h2>
            <p className="mt-3 text-sm text-destructive">{error}</p>
            <button
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold tracking-widest text-card-foreground">
              GIZA
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Connect your wallet...
            </p>
            <svg
              className="mx-auto mt-4 h-5 w-5 animate-spin text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="mt-3 text-xs text-muted-foreground">{status}</p>
            <p className="mt-4 text-xs text-muted-foreground/50">
              Secured by Privy
            </p>
          </>
        )}
      </div>
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
