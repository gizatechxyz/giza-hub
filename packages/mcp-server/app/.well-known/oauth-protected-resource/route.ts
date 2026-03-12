import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from 'mcp-handler';
import { getBaseUrl } from '../../../src/constants';

const corsHandler = metadataCorsOptionsRequestHandler();

export function GET(req: Request): Response {
  const baseUrl = getBaseUrl();
  const handler = protectedResourceHandler({
    authServerUrls: [baseUrl],
    resourceUrl: baseUrl,
  });
  return handler(req);
}

export function OPTIONS(): Response {
  return corsHandler();
}
