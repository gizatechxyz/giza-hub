import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

type ToolHandler = (params: Record<string, unknown>, extra: Record<string, unknown>) => Promise<CallToolResult>;

interface RegisteredTool {
  name: string;
  metadata: Record<string, unknown>;
  handler: ToolHandler;
}

export function createTestServer() {
  const tools = new Map<string, RegisteredTool>();

  return {
    registerTool(
      name: string,
      metadata: Record<string, unknown>,
      handler: ToolHandler,
    ) {
      tools.set(name, { name, metadata, handler });
    },

    getToolNames(): string[] {
      return [...tools.keys()];
    },

    hasTool(name: string): boolean {
      return tools.has(name);
    },

    async invokeTool(
      name: string,
      params: Record<string, unknown> = {},
      extra: Record<string, unknown> = {},
    ): Promise<CallToolResult> {
      const tool = tools.get(name);
      if (!tool) {
        throw new Error(`Tool "${name}" not registered`);
      }
      return tool.handler(params, extra);
    },
  };
}

export type TestServer = ReturnType<typeof createTestServer>;
