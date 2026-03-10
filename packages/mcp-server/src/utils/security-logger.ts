type SecurityEvent =
  | 'auth_success'
  | 'auth_failure'
  | 'confirmation_created'
  | 'confirmation_executed'
  | 'token_exchange'
  | 'token_refresh'
  | 'rate_limited';

interface SecurityLogEntry {
  timestamp: string;
  event: SecurityEvent;
  [key: string]: unknown;
}

class SecurityLogger {
  private log(entry: SecurityLogEntry): void {
    console.log(JSON.stringify(entry));
  }

  authSuccess(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'auth_success', ...details });
  }

  authFailure(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'auth_failure', ...details });
  }

  confirmationCreated(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'confirmation_created', ...details });
  }

  confirmationExecuted(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'confirmation_executed', ...details });
  }

  tokenExchange(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'token_exchange', ...details });
  }

  tokenRefresh(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'token_refresh', ...details });
  }

  rateLimited(details: Record<string, unknown>): void {
    this.log({ timestamp: new Date().toISOString(), event: 'rate_limited', ...details });
  }
}

export const securityLogger = new SecurityLogger();
