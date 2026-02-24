import { createTestHarness } from './helpers/mcp-client.js';
import { DEFAULT_SYSTEM_PROMPT } from '../prompt.js';

describe('prompt registration', () => {
  it('listPrompts returns the system prompt', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      const result = await client.listPrompts();
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0]!.name).toBe('system');
    } finally {
      await cleanup();
    }
  });

  it('getPrompt returns default system prompt text', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      const result = await client.getPrompt({ name: 'system' });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]!.role).toBe('assistant');
      const content = result.messages[0]!.content as {
        type: string;
        text: string;
      };
      expect(content.text).toBe(DEFAULT_SYSTEM_PROMPT);
    } finally {
      await cleanup();
    }
  });

  it('custom systemPrompt override appears in getPrompt response', async () => {
    const customPrompt = 'You are a custom test assistant.';
    const { client, cleanup } = await createTestHarness({
      systemPrompt: customPrompt,
    });
    try {
      const result = await client.getPrompt({ name: 'system' });
      const content = result.messages[0]!.content as {
        type: string;
        text: string;
      };
      expect(content.text).toBe(customPrompt);
    } finally {
      await cleanup();
    }
  });
});
