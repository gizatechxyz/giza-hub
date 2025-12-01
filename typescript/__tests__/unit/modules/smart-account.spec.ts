import { SmartAccountModule } from '../../../src/modules/smart-account.module';
import { HttpClient } from '../../../src/http/client';
import { Chain, ValidationError, NotImplementedError } from '../../../src/types/common';
import { ResolvedGizaAgentConfig } from '../../../src/types/config';
import { VALID_ADDRESSES, INVALID_ADDRESSES } from '../../fixtures/addresses';
import {
  MOCK_SMART_ACCOUNT_RESPONSE_1,
} from '../../fixtures/accounts';

describe('SmartAccountModule', () => {
  let module: SmartAccountModule;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockConfig: ResolvedGizaAgentConfig;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      setHeaders: jest.fn(),
    } as any;

    // Create mock config
    mockConfig = {
      partnerApiKey: 'test-api-key',
      backendUrl: 'https://api.test.giza.example',
      chainId: Chain.BASE,
      agentId: 'arma-dev',
      timeout: 45000,
      enableRetry: false,
    };

    module = new SmartAccountModule(mockHttpClient, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create smart account with valid address', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await module.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/proxy/zerodev/smart-accounts',
        {
          eoa: VALID_ADDRESSES.EOA_1,
          chain: Chain.BASE,
          agent_id: 'arma-dev',
        }
      );

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });
    });

    it('should use chain ID from config', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);
      const arbitrumConfig = { ...mockConfig, chainId: Chain.ARBITRUM };
      const arbitrumModule = new SmartAccountModule(mockHttpClient, arbitrumConfig);

      await arbitrumModule.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/proxy/zerodev/smart-accounts',
        expect.objectContaining({
          chain: Chain.ARBITRUM,
        })
      );
    });

    it('should use agent ID from config', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);
      const customConfig = { ...mockConfig, agentId: 'custom-agent' };
      const customModule = new SmartAccountModule(mockHttpClient, customConfig);

      await customModule.create({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/api/v1/proxy/zerodev/smart-accounts',
        expect.objectContaining({
          agent_id: 'custom-agent',
        })
      );
    });

    it('should throw ValidationError for empty origin wallet', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('origin wallet address is required');
    });

    it('should throw ValidationError for address missing 0x prefix', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.MISSING_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.MISSING_PREFIX as any,
        })
      ).rejects.toThrow('must be a valid Ethereum address');
    });

    it('should throw ValidationError for too short address', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.TOO_SHORT as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for too long address', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.TOO_LONG as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for address with invalid characters', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for address with wrong prefix', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.WRONG_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for address with only prefix', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.ONLY_PREFIX as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for address with spaces', async () => {
      await expect(
        module.create({
          origin_wallet: INVALID_ADDRESSES.WITH_SPACES as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should accept address with lowercase hex', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const lowerCaseAddress = VALID_ADDRESSES.EOA_1.toLowerCase() as any;
      await expect(
        module.create({ origin_wallet: lowerCaseAddress })
      ).resolves.toBeDefined();
    });

    it('should accept address with uppercase hex', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const mixedCaseAddress = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12' as any;
      await expect(
        module.create({ origin_wallet: mixedCaseAddress })
      ).resolves.toBeDefined();
    });

    it('should accept address with mixed case hex', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      await expect(
        module.create({ origin_wallet: VALID_ADDRESSES.EOA_1 })
      ).resolves.toBeDefined();
    });
  });

  describe('getInfo', () => {
    it('should get info with origin wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await module.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      const expectedUrl = `/api/v1/proxy/zerodev/smart-accounts?chain=${Chain.BASE}&eoa=${VALID_ADDRESSES.EOA_1}&agent_id=arma-dev`;
      expect(mockHttpClient.get).toHaveBeenCalledWith(expectedUrl);

      expect(result).toEqual({
        smartAccountAddress: MOCK_SMART_ACCOUNT_RESPONSE_1.smartAccount,
        backendWallet: MOCK_SMART_ACCOUNT_RESPONSE_1.backendWallet,
        origin_wallet: VALID_ADDRESSES.EOA_1,
        chain: Chain.BASE,
      });
    });

    it('should get info with both smartAccount and origin_wallet', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      const result = await module.getInfo({
        smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      // Should use origin_wallet in query
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`eoa=${VALID_ADDRESSES.EOA_1}`)
      );

      expect(result).toBeDefined();
    });

    it('should throw NotImplementedError with only smartAccount', async () => {
      await expect(
        module.getInfo({
          smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(NotImplementedError);

      await expect(
        module.getInfo({
          smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow('Looking up smart account by address alone is not yet supported');
    });

    it('should throw ValidationError with no parameters', async () => {
      await expect(module.getInfo({})).rejects.toThrow(ValidationError);

      await expect(module.getInfo({})).rejects.toThrow(
        'Either smartAccount or origin wallet must be provided'
      );
    });

    it('should validate origin wallet address format', async () => {
      await expect(
        module.getInfo({
          origin_wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.getInfo({
          origin_wallet: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow('must be a valid Ethereum address');
    });

    it('should use correct chain and agent ID from config', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);
      const customConfig = {
        ...mockConfig,
        chainId: Chain.ARBITRUM,
        agentId: 'custom-agent',
      };
      const customModule = new SmartAccountModule(mockHttpClient, customConfig);

      await customModule.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`chain=${Chain.ARBITRUM}`)
      );
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`agent_id=custom-agent`)
      );
    });

    it('should properly encode URL parameters', async () => {
      mockHttpClient.get.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      await module.getInfo({
        origin_wallet: VALID_ADDRESSES.EOA_1,
      });

      // Verify the URL is properly formed with query params
      const call = mockHttpClient.get.mock.calls[0][0];
      expect(call).toContain('?');
      expect(call).toContain('chain=');
      expect(call).toContain('eoa=');
      expect(call).toContain('agent_id=');
    });
  });

  describe('updatePermissions', () => {
    it('should throw NotImplementedError', async () => {
      await expect(
        module.updatePermissions({
          smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(NotImplementedError);

      await expect(
        module.updatePermissions({
          smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow('Permission updates are not yet available');
    });

    it('should validate smart account address before throwing NotImplementedError', async () => {
      await expect(
        module.updatePermissions({
          smartAccount: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.updatePermissions({
          smartAccount: INVALID_ADDRESSES.INVALID_CHARS as any,
        })
      ).rejects.toThrow('must be a valid Ethereum address');
    });

    it('should throw ValidationError for empty smart account', async () => {
      await expect(
        module.updatePermissions({
          smartAccount: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        module.updatePermissions({
          smartAccount: INVALID_ADDRESSES.EMPTY as any,
        })
      ).rejects.toThrow('Smart account address is required');
    });

    it('should validate address format before implementation check', async () => {
      // ValidationError should come before NotImplementedError
      await expect(
        module.updatePermissions({
          smartAccount: INVALID_ADDRESSES.TOO_SHORT as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotImplementedError with valid address', async () => {
      // With valid address, should reach NotImplementedError
      await expect(
        module.updatePermissions({
          smartAccount: VALID_ADDRESSES.SMART_ACCOUNT_1,
        })
      ).rejects.toThrow(NotImplementedError);
    });
  });

  describe('address validation edge cases', () => {
    it('should accept all valid test addresses for create', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      for (const address of Object.values(VALID_ADDRESSES)) {
        await expect(module.create({ origin_wallet: address })).resolves.toBeDefined();
      }
    });

    it('should reject all invalid test addresses for create', async () => {
      for (const address of Object.values(INVALID_ADDRESSES)) {
        if (address !== INVALID_ADDRESSES.EMPTY) {
          // Empty is tested separately
          await expect(
            module.create({ origin_wallet: address as any })
          ).rejects.toThrow(ValidationError);
        }
      }
    });

    it('should handle checksum addresses', async () => {
      mockHttpClient.post.mockResolvedValue(MOCK_SMART_ACCOUNT_RESPONSE_1);

      // EIP-55 checksum address
      const checksumAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed' as any;
      await expect(module.create({ origin_wallet: checksumAddress })).resolves.toBeDefined();
    });
  });

  describe('HTTP client integration', () => {
    it('should propagate HTTP errors from create', async () => {
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(
        module.create({ origin_wallet: VALID_ADDRESSES.EOA_1 })
      ).rejects.toThrow('Network error');
    });

    it('should propagate HTTP errors from getInfo', async () => {
      const error = new Error('API error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(
        module.getInfo({ origin_wallet: VALID_ADDRESSES.EOA_1 })
      ).rejects.toThrow('API error');
    });

    it('should not call HTTP client if validation fails', async () => {
      await expect(
        module.create({ origin_wallet: INVALID_ADDRESSES.INVALID_CHARS as any })
      ).rejects.toThrow();

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });
});

