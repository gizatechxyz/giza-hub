import { GizaAPIError, TimeoutError, NetworkError } from '../../../src/http/errors';
import { GizaError } from '../../../src/types/common';

describe('GizaAPIError', () => {
  describe('constructor', () => {
    it('should create error with all parameters', () => {
      const error = new GizaAPIError(
        'Test error',
        404,
        { detail: 'Not found' },
        '/api/test',
        'GET'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GizaError);
      expect(error).toBeInstanceOf(GizaAPIError);
      expect(error.name).toBe('GizaAPIError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.responseData).toEqual({ detail: 'Not found' });
      expect(error.requestUrl).toBe('/api/test');
      expect(error.requestMethod).toBe('GET');
    });

    it('should create error with minimal parameters', () => {
      const error = new GizaAPIError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.responseData).toBeUndefined();
      expect(error.requestUrl).toBeUndefined();
      expect(error.requestMethod).toBeUndefined();
    });
  });

  describe('fromResponse', () => {
    it('should parse error from response with message field', () => {
      const responseData = { message: 'Invalid request' };
      const error = GizaAPIError.fromResponse(400, responseData, '/api/test', 'POST');

      expect(error.message).toBe('Bad Request: Invalid request');
      expect(error.statusCode).toBe(400);
      expect(error.responseData).toEqual(responseData);
    });

    it('should parse error from response with detail field', () => {
      const responseData = { detail: 'Resource not found' };
      const error = GizaAPIError.fromResponse(404, responseData);

      expect(error.message).toBe('Not Found: Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should parse error from response with error field', () => {
      const responseData = { error: 'Unauthorized access' };
      const error = GizaAPIError.fromResponse(401, responseData);

      expect(error.message).toBe('Unauthorized: Unauthorized access');
      expect(error.statusCode).toBe(401);
    });

    it('should prioritize message over detail', () => {
      const responseData = {
        message: 'Message text',
        detail: 'Detail text',
        error: 'Error text',
      };
      const error = GizaAPIError.fromResponse(400, responseData);

      expect(error.message).toContain('Message text');
      expect(error.message).not.toContain('Detail text');
      expect(error.message).not.toContain('Error text');
    });

    it('should parse error from string response', () => {
      const error = GizaAPIError.fromResponse(500, 'Server error occurred');

      expect(error.message).toBe('Server Error: Server error occurred');
      expect(error.statusCode).toBe(500);
    });

    it('should handle empty response data', () => {
      const error = GizaAPIError.fromResponse(500, null);

      expect(error.message).toBe('Server Error: API request failed');
      expect(error.statusCode).toBe(500);
    });

    it('should add correct context for 400 Bad Request', () => {
      const error = GizaAPIError.fromResponse(400, { message: 'Invalid params' });
      expect(error.message).toBe('Bad Request: Invalid params');
    });

    it('should add correct context for 401 Unauthorized', () => {
      const error = GizaAPIError.fromResponse(401, { message: 'Invalid token' });
      expect(error.message).toBe('Unauthorized: Invalid token');
    });

    it('should add correct context for 403 Forbidden', () => {
      const error = GizaAPIError.fromResponse(403, { message: 'Access denied' });
      expect(error.message).toBe('Forbidden: Access denied');
    });

    it('should add correct context for 404 Not Found', () => {
      const error = GizaAPIError.fromResponse(404, { message: 'Resource missing' });
      expect(error.message).toBe('Not Found: Resource missing');
    });

    it('should add correct context for 500+ Server Errors', () => {
      const error500 = GizaAPIError.fromResponse(500, { message: 'Internal error' });
      const error502 = GizaAPIError.fromResponse(502, { message: 'Bad gateway' });
      const error503 = GizaAPIError.fromResponse(503, { message: 'Service unavailable' });

      expect(error500.message).toBe('Server Error: Internal error');
      expect(error502.message).toBe('Server Error: Bad gateway');
      expect(error503.message).toBe('Server Error: Service unavailable');
    });

    it('should not add context for other status codes', () => {
      const error = GizaAPIError.fromResponse(418, { message: "I'm a teapot" });
      expect(error.message).toBe("I'm a teapot");
    });
  });

  describe('friendlyMessage', () => {
    it('should return friendly message for 400', () => {
      const error = new GizaAPIError('Bad Request', 400);
      expect(error.friendlyMessage).toBe('Invalid request. Please check your parameters.');
    });

    it('should return friendly message for 401', () => {
      const error = new GizaAPIError('Unauthorized', 401);
      expect(error.friendlyMessage).toBe('Authentication failed. Please check your API key.');
    });

    it('should return friendly message for 403', () => {
      const error = new GizaAPIError('Forbidden', 403);
      expect(error.friendlyMessage).toBe(
        'Access denied. You do not have permission to perform this action.'
      );
    });

    it('should return friendly message for 404', () => {
      const error = new GizaAPIError('Not Found', 404);
      expect(error.friendlyMessage).toBe(
        'Resource not found. Please check the address or parameters.'
      );
    });

    it('should return friendly message for 429', () => {
      const error = new GizaAPIError('Too Many Requests', 429);
      expect(error.friendlyMessage).toBe('Too many requests. Please wait and try again.');
    });

    it('should return friendly message for 500', () => {
      const error = new GizaAPIError('Server Error', 500);
      expect(error.friendlyMessage).toBe('Server error. Please try again later.');
    });

    it('should return friendly message for 502', () => {
      const error = new GizaAPIError('Bad Gateway', 502);
      expect(error.friendlyMessage).toBe('Server error. Please try again later.');
    });

    it('should return friendly message for 503', () => {
      const error = new GizaAPIError('Service Unavailable', 503);
      expect(error.friendlyMessage).toBe('Server error. Please try again later.');
    });

    it('should return friendly message for 504', () => {
      const error = new GizaAPIError('Gateway Timeout', 504);
      expect(error.friendlyMessage).toBe('Server error. Please try again later.');
    });

    it('should return original message for unknown status codes', () => {
      const error = new GizaAPIError('Custom error message', 418);
      expect(error.friendlyMessage).toBe('Custom error message');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new GizaAPIError(
        'Test error',
        404,
        { detail: 'Not found' },
        '/api/test',
        'GET'
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'GizaAPIError',
        message: 'Test error',
        statusCode: 404,
        requestUrl: '/api/test',
        requestMethod: 'GET',
        responseData: { detail: 'Not found' },
      });
    });

    it('should serialize error with partial data', () => {
      const error = new GizaAPIError('Simple error', 500);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'GizaAPIError',
        message: 'Simple error',
        statusCode: 500,
        requestUrl: undefined,
        requestMethod: undefined,
        responseData: undefined,
      });
    });
  });
});

describe('TimeoutError', () => {
  it('should create timeout error with timeout value', () => {
    const error = new TimeoutError(30000);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GizaError);
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Request timed out after 30000ms');
  });

  it('should handle different timeout values', () => {
    const error1 = new TimeoutError(5000);
    const error2 = new TimeoutError(60000);

    expect(error1.message).toBe('Request timed out after 5000ms');
    expect(error2.message).toBe('Request timed out after 60000ms');
  });

  it('should have correct prototype chain', () => {
    const error = new TimeoutError(10000);
    expect(Object.getPrototypeOf(error)).toBe(TimeoutError.prototype);
  });
});

describe('NetworkError', () => {
  it('should create network error with message', () => {
    const error = new NetworkError('Connection refused');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GizaError);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Network error: Connection refused');
  });

  it('should prepend "Network error:" to message', () => {
    const error = new NetworkError('DNS lookup failed');
    expect(error.message).toBe('Network error: DNS lookup failed');
  });

  it('should have correct prototype chain', () => {
    const error = new NetworkError('Test');
    expect(Object.getPrototypeOf(error)).toBe(NetworkError.prototype);
  });

  it('should handle empty message', () => {
    const error = new NetworkError('');
    expect(error.message).toBe('Network error: ');
  });
});

