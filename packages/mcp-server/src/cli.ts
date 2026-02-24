import { serve } from './serve.js';

serve().catch((error: unknown) => {
  console.error('Failed to start Giza MCP server:', error);
  process.exit(1);
});
