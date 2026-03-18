import React, { useEffect, useRef, useState } from 'react';
import { PrivyProvider, usePrivy, getIdentityToken } from '@privy-io/react-auth';
import type { PrivyClientConfig } from '@privy-io/react-auth';

function GizaAppLogo(): React.ReactElement {
  return (
    <svg width="120" viewBox="0 0 84 34" fill="none">
      <path
        d="M80.6462 20.8461V19.9284C76.1927 20.3602 73.3587 21.035 73.3587 23.0323C73.3587 24.4088 74.4114 25.3265 76.1658 25.3265C78.4599 25.3265 80.6462 24.2739 80.6462 20.8461ZM75.6259 27.2698C72.8999 27.2698 70.6327 25.7583 70.6327 23.0863C70.6327 19.6585 74.5193 18.6329 80.4572 17.9851V17.6342C80.4572 14.9622 78.9997 14.0985 77.1644 14.0985C75.1131 14.0985 73.9525 15.1781 73.8446 16.9864H71.3075C71.5234 13.8556 74.3304 12.1012 77.1374 12.1012C81.159 12.1012 82.9403 13.9905 82.9133 18.0931L82.8864 21.4399C82.8594 23.896 82.9673 25.5424 83.2642 26.9189H80.7811C80.7001 26.3791 80.6192 25.7853 80.5922 24.9216C79.7015 26.4331 78.217 27.2698 75.6259 27.2698Z"
        fill="white"
      />
      <path
        d="M58.2064 26.9189V24.7867L66.6004 14.5303H58.7462V12.3981H69.4614V14.5303L61.0944 24.7867H69.6233V26.9189H58.2064Z"
        fill="white"
      />
      <path
        d="M53.7165 12.3981H56.1726V26.9189H53.7165V12.3981ZM53.7165 7.35088H56.1726V10.3198H53.7165V7.35088Z"
        fill="white"
      />
      <path
        d="M42.2852 7C46.3338 7 49.5726 9.26719 50.3823 13.0458H47.7103C47.0625 10.8596 45.2812 9.32117 42.1503 9.32117C38.6955 9.32117 35.9965 12.0202 35.9965 17.0944C35.9965 22.0606 38.5605 24.9486 42.1503 24.9486C44.7413 24.9486 47.9262 23.869 47.9262 19.8204V19.3076H42.7441V16.9325H50.5173V26.9189H48.3581L48.2231 24.4628C46.9546 26.4871 44.6604 27.2698 42.0423 27.2698C36.4283 27.2698 33.1895 23.0323 33.1895 17.0944C33.1895 11.0486 36.7792 7 42.2852 7Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.42901e-08 13.0465C0.000234991 5.84127 5.84124 0.000103997 13.0465 0C20.2518 1.47864e-07 26.0928 5.84121 26.093 13.0465V20.9535C26.0929 28.1589 20.2519 34 13.0465 34C5.84116 33.9999 0.000104425 28.1588 0 20.9535L9.42901e-08 13.0465ZM16.9504 3.00105C16.0689 2.65842 15.2319 3.43133 15.4121 4.35975C15.937 7.06309 16.9012 9.90281 18.1793 12.3197C19.0678 13.9997 20.0857 15.4325 21.1718 16.4666C21.5109 16.7894 21.8508 17.068 22.1902 17.302C22.9463 17.8235 23.824 17.1842 23.824 16.2657V13.0465C23.8239 8.47138 20.9727 4.5644 16.9504 3.00105ZM15.533 29.6151C15.2667 30.536 16.1153 31.3322 17.0068 30.9798C19.8913 29.8393 22.1651 27.49 23.205 24.5561C23.5229 23.6591 22.7099 22.84 21.8034 23.1298C20.3196 23.6042 19.0213 24.3459 17.9722 25.3773C16.908 26.4236 16.0549 27.8106 15.533 29.6151ZM2.97468 20.3572C2.97468 20.4227 3.02188 20.4785 3.08628 20.4901C5.61472 20.9437 7.93891 21.9776 9.75164 23.7598C11.3708 25.3518 12.5156 27.4792 13.0653 30.1656C13.6151 27.479 14.762 25.3518 16.3812 23.7598C18.194 21.9777 20.5182 20.9436 23.0466 20.4901C23.111 20.4785 23.1582 20.4227 23.1582 20.3572C23.1582 20.2971 23.1182 20.2444 23.0605 20.2271C21.7883 19.8466 20.6291 19.0834 19.6063 18.1095C18.2915 16.8577 17.1385 15.2046 16.1741 13.3811C14.6897 10.5742 13.6006 7.25827 13.0664 4.13464C12.5323 7.25816 11.4431 10.5743 9.95881 13.3811C8.99449 15.2045 7.84126 16.8577 6.52657 18.1095C5.50386 19.0833 4.34446 19.8465 3.07233 20.2271C3.0147 20.2444 2.97468 20.2971 2.97468 20.3572ZM2.26896 16.2937C2.26896 17.2066 3.13784 17.8468 3.89387 17.3351C4.24952 17.0944 4.60579 16.8048 4.96113 16.4666C6.04707 15.4325 7.06516 13.9996 7.95353 12.3197C9.23378 9.89865 10.1979 7.05308 10.7218 4.3455C10.901 3.41922 10.0677 2.64693 9.18679 2.98481C5.14131 4.53657 2.26914 8.45475 2.26896 13.0465V16.2937ZM4.28193 23.1149C3.37617 22.8295 2.56612 23.6475 2.88229 24.543C3.92575 27.4982 6.22131 29.8616 9.13203 30.9967C10.0229 31.3441 10.8677 30.5487 10.6033 29.6298C10.0821 27.8182 9.22773 26.4264 8.16071 25.3773C7.10046 24.3349 5.78554 23.5885 4.28193 23.1149Z"
        fill="white"
      />
    </svg>
  );
}

declare global {
  interface Window {
    __GIZA_LOGIN_CONFIG__: {
      appId: string;
      callbackUrl: string;
      state: string;
    };
  }
}

function addHiddenInput(
  form: HTMLFormElement,
  name: string,
  value: string,
): void {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

function LoginInner(): React.ReactElement {
  const { ready, authenticated, login } = usePrivy();
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const loginTriggered = useRef(false);
  const submitted = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!ready) return;

    if (authenticated) {
      if (submitted.current) return;
      submitted.current = true;
      setStatus('Retrieving tokens...');
      getIdentityToken()
        .then((idToken) => {
          if (!mounted) return;
          if (!idToken) {
            setError('Failed to retrieve identity token.');
            return;
          }
          const { callbackUrl, state } = window.__GIZA_LOGIN_CONFIG__;
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = callbackUrl;
          addHiddenInput(form, 'privy_id_token', idToken);
          addHiddenInput(form, 'state', state);
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
  }, [ready, authenticated, login]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#101010',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <GizaAppLogo />
            </div>
            <p style={{ fontSize: 14, color: '#ff453f', marginBottom: 16 }}>
              {error}
            </p>
            <button
              style={{
                background: '#BDEE63',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <GizaAppLogo />
            </div>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              Connect your wallet...
            </p>
            <svg
              style={{ width: 20, height: 20, margin: '0 auto', color: '#BDEE63' }}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle opacity={0.25} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path opacity={0.75} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
            <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>{status}</p>
            <p style={{ fontSize: 12, color: '#555', marginTop: 16 }}>
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

const PRIVY_CONFIG = {
  appearance: {
    accentColor: '#BDEE63',
    theme: '#121113',
    showWalletLoginFirst: true,
    logo: '/icon.png',
    walletChainType: 'ethereum-only',
    walletList: [
      'detected_ethereum_wallets',
      'metamask',
      'wallet_connect_qr',
      'rainbow',
      'binance',
      'coinbase_wallet',
      'safe',
      'wallet_connect',
    ],
  },
  loginMethods: ['wallet'],
  embeddedWallets: {
    ethereum: { createOnLogin: 'users-without-wallets' },
  },
} as const satisfies PrivyClientConfig;

export function LoginPage({ appId }: LoginPageProps): React.ReactElement {
  return (
    <PrivyProvider appId={appId} config={PRIVY_CONFIG}>
      <LoginInner />
    </PrivyProvider>
  );
}
