import { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { HttpClient } from '../../../src/http/client';
import { GizaAPIError, TimeoutError, NetworkError } from '../../../src/http/errors';

describe('HttpClient', () => {
  let client: HttpClient;
  let mockAxios: MockAdapter;
  let axiosInstance: AxiosInstance;

  beforeEach(() => {
    client = new HttpClient({
      baseURL: 'https://api.test.giza.example',
      timeout: 10000,
      headers: {
        'X-Test-Header': 'test-value',
      },
    });

    // Get the underlying axios instance to mock it
    axiosInstance = (client as any).axiosInstance;
    mockAxios = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('constructor', () => {
    it('should create client with basic config', () => {
      const testClient = new HttpClient({
        baseURL: 'https://api.example.com',
      });
      expect(testClient).toBeInstanceOf(HttpClient);
    });

    it('should apply default timeout if not provided', () => {
      const testClient = new HttpClient({
        baseURL: 'https://api.example.com',
      });
      const instance = (testClient as any).axiosInstance;
      expect(instance.defaults.timeout).toBe(45000);
    });

    it('should use provided timeout', () => {
      const testClient = new HttpClient({
        baseURL: 'https://api.example.com',
        timeout: 30000,
      });
      const instance = (testClient as any).axiosInstance;
      expect(instance.defaults.timeout).toBe(30000);
    });

    it('should set custom headers', () => {
      const testClient = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: {
          'X-Custom': 'value',
          'X-Another': 'another-value',
        },
      });
      
      // Headers are stored in the customHeaders property
      const customHeaders = (testClient as any).customHeaders;
      expect(customHeaders['X-Custom']).toBe('value');
      expect(customHeaders['X-Another']).toBe('another-value');
    });

    it('should set Content-Type header by default', () => {
      const instance = (client as any).axiosInstance;
      // Content-Type is set in the defaults, not in common headers
      expect(instance.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockAxios.onGet('/test').reply(200, responseData);

      const result = await client.get('/test');

      expect(result).toEqual(responseData);
    });

    it('should pass query parameters', async () => {
      mockAxios.onGet('/test?param1=value1').reply(200, { success: true });

      const result = await client.get('/test?param1=value1');

      expect(result).toEqual({ success: true });
    });

    it('should include custom headers in request', async () => {
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.['X-Test-Header']).toBe('test-value');
        return [200, { success: true }];
      });

      await client.get('/test');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { name: 'Test' };
      const responseData = { id: 1, ...requestData };
      mockAxios.onPost('/test', requestData).reply(201, responseData);

      const result = await client.post('/test', requestData);

      expect(result).toEqual(responseData);
    });

    it('should handle POST without body', async () => {
      mockAxios.onPost('/test').reply(200, { success: true });

      const result = await client.post('/test');

      expect(result).toEqual({ success: true });
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const requestData = { id: 1, name: 'Updated' };
      mockAxios.onPut('/test/1', requestData).reply(200, requestData);

      const result = await client.put('/test/1', requestData);

      expect(result).toEqual(requestData);
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const requestData = { name: 'Patched' };
      mockAxios.onPatch('/test/1', requestData).reply(200, requestData);

      const result = await client.patch('/test/1', requestData);

      expect(result).toEqual(requestData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockAxios.onDelete('/test/1').reply(204);

      const result = await client.delete('/test/1');

      expect(result).toBeUndefined();
    });

    it('should handle DELETE with response body', async () => {
      mockAxios.onDelete('/test/1').reply(200, { deleted: true });

      const result = await client.delete('/test/1');

      expect(result).toEqual({ deleted: true });
    });
  });

  describe('error handling', () => {
    it('should transform 400 error to GizaAPIError', async () => {
      mockAxios.onGet('/test').reply(400, { message: 'Bad request' });

      await expect(client.get('/test')).rejects.toThrow(GizaAPIError);
      await expect(client.get('/test')).rejects.toThrow('Bad Request');
    });

    it('should transform 401 error to GizaAPIError', async () => {
      mockAxios.onGet('/test').reply(401, { message: 'Unauthorized' });

      await expect(client.get('/test')).rejects.toThrow(GizaAPIError);
      await expect(client.get('/test')).rejects.toThrow('Unauthorized');
    });

    it('should transform 404 error to GizaAPIError', async () => {
      mockAxios.onGet('/test').reply(404, { message: 'Not found' });

      await expect(client.get('/test')).rejects.toThrow(GizaAPIError);
      await expect(client.get('/test')).rejects.toThrow('Not Found');
    });

    it('should transform 500 error to GizaAPIError', async () => {
      mockAxios.onGet('/test').reply(500, { message: 'Server error' });

      await expect(client.get('/test')).rejects.toThrow(GizaAPIError);
      await expect(client.get('/test')).rejects.toThrow('Server Error');
    });

    it('should include status code in error', async () => {
      mockAxios.onGet('/test').reply(403, { message: 'Forbidden' });

      try {
        await client.get('/test');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GizaAPIError);
        expect((error as GizaAPIError).statusCode).toBe(403);
      }
    });

    it('should handle timeout error', async () => {
      mockAxios.onGet('/test').timeout();

      await expect(client.get('/test')).rejects.toThrow(TimeoutError);
    });

    it('should handle network error', async () => {
      mockAxios.onGet('/test').networkError();

      await expect(client.get('/test')).rejects.toThrow(NetworkError);
    });
  });

  describe('retry logic', () => {
    it('should not retry by default', async () => {
      let callCount = 0;
      mockAxios.onGet('/test').reply(() => {
        callCount++;
        return [500, { message: 'Server error' }];
      });

      await expect(client.get('/test')).rejects.toThrow(GizaAPIError);
      expect(callCount).toBe(1);
    });

    it('should retry 5xx errors when enabled', async () => {
      const clientWithRetry = new HttpClient({
        baseURL: 'https://api.test.giza.example',
        enableRetry: true,
      });
      const retryAxios = (clientWithRetry as any).axiosInstance;
      const mockRetryAxios = new MockAdapter(retryAxios);

      let callCount = 0;
      mockRetryAxios.onGet('/test').reply(() => {
        callCount++;
        return [500, { message: 'Server error' }];
      });

      await expect(clientWithRetry.get('/test')).rejects.toThrow(GizaAPIError);
      expect(callCount).toBe(2); // Original + 1 retry

      mockRetryAxios.restore();
    });

    it('should retry network errors when enabled', async () => {
      const clientWithRetry = new HttpClient({
        baseURL: 'https://api.test.giza.example',
        enableRetry: true,
      });
      const retryAxios = (clientWithRetry as any).axiosInstance;
      const mockRetryAxios = new MockAdapter(retryAxios);

      let callCount = 0;
      mockRetryAxios.onGet('/test').reply(() => {
        callCount++;
        return mockRetryAxios.networkError();
      });

      await expect(clientWithRetry.get('/test')).rejects.toThrow(NetworkError);
      expect(callCount).toBe(2); // Original + 1 retry

      mockRetryAxios.restore();
    });

    it('should not retry 4xx errors', async () => {
      const clientWithRetry = new HttpClient({
        baseURL: 'https://api.test.giza.example',
        enableRetry: true,
      });
      const retryAxios = (clientWithRetry as any).axiosInstance;
      const mockRetryAxios = new MockAdapter(retryAxios);

      let callCount = 0;
      mockRetryAxios.onGet('/test').reply(() => {
        callCount++;
        return [400, { message: 'Bad request' }];
      });

      await expect(clientWithRetry.get('/test')).rejects.toThrow(GizaAPIError);
      expect(callCount).toBe(1); // No retry for 4xx

      mockRetryAxios.restore();
    });

    it('should succeed on retry', async () => {
      const clientWithRetry = new HttpClient({
        baseURL: 'https://api.test.giza.example',
        enableRetry: true,
      });
      const retryAxios = (clientWithRetry as any).axiosInstance;
      const mockRetryAxios = new MockAdapter(retryAxios);

      let callCount = 0;
      mockRetryAxios.onGet('/test').reply(() => {
        callCount++;
        if (callCount === 1) {
          return [500, { message: 'Server error' }];
        }
        return [200, { success: true }];
      });

      const result = await clientWithRetry.get('/test');
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(2);

      mockRetryAxios.restore();
    });
  });

  describe('setHeaders', () => {
    it('should update headers', () => {
      client.setHeaders({ 'X-New-Header': 'new-value' });

      const instance = (client as any).axiosInstance;
      expect(instance.defaults.headers.common['X-New-Header']).toBe('new-value');
    });

    it('should merge with existing headers', () => {
      client.setHeaders({ 'X-Another': 'another' });

      const customHeaders = (client as any).customHeaders;
      expect(customHeaders['X-Test-Header']).toBe('test-value');
      expect(customHeaders['X-Another']).toBe('another');
    });

    it('should override existing header', () => {
      client.setHeaders({ 'X-Test-Header': 'updated-value' });

      const instance = (client as any).axiosInstance;
      expect(instance.defaults.headers.common['X-Test-Header']).toBe('updated-value');
    });

    it('should apply updated headers to subsequent requests', async () => {
      client.setHeaders({ 'X-Dynamic': 'dynamic-value' });

      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.['X-Dynamic']).toBe('dynamic-value');
        return [200, { success: true }];
      });

      await client.get('/test');
    });
  });

  describe('setHeaders security', () => {
    it('should reject Authorization override', () => {
      expect(() =>
        client.setHeaders({ Authorization: 'Bearer evil' }),
      ).toThrow('protected header');
    });

    it('should reject Content-Type override', () => {
      expect(() =>
        client.setHeaders({ 'content-type': 'text/html' }),
      ).toThrow('protected header');
    });

    it('should reject CRLF in header values', () => {
      expect(() =>
        client.setHeaders({ 'X-Custom': 'value\r\nEvil: header' }),
      ).toThrow('invalid characters');
    });

    it('should accept safe custom headers', () => {
      expect(() =>
        client.setHeaders({ 'X-Request-ID': '12345' }),
      ).not.toThrow();
    });
  });

  describe('request method', () => {
    it('should handle custom config', async () => {
      mockAxios.onGet('/test').reply(200, { success: true });

      const result = await client.request({
        method: 'GET',
        url: '/test',
        headers: { 'X-Custom': 'custom' },
      });

      expect(result).toEqual({ success: true });
    });

    it('should handle all HTTP methods', async () => {
      mockAxios.onAny().reply(200, { success: true });

      await expect(client.request({ method: 'GET', url: '/test' })).resolves.toEqual({
        success: true,
      });
      await expect(client.request({ method: 'POST', url: '/test' })).resolves.toEqual({
        success: true,
      });
      await expect(client.request({ method: 'PUT', url: '/test' })).resolves.toEqual({
        success: true,
      });
      await expect(client.request({ method: 'PATCH', url: '/test' })).resolves.toEqual({
        success: true,
      });
      await expect(client.request({ method: 'DELETE', url: '/test' })).resolves.toEqual({
        success: true,
      });
    });
  });
});

