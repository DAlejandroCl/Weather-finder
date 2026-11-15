import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiDeps, ApiResult } from "./openweather";

type Endpoint = (
  method: string | undefined,
  query: URLSearchParams,
  deps: ApiDeps,
) => Promise<ApiResult>;

/**
 * Turns an endpoint into a plain Node handler. Vercel Functions and the Vite dev server
 * both call it with a Node request and response, so one wrapper serves both.
 */
export function toNodeHandler(endpoint: Endpoint, readKey: () => string | undefined) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const result = await endpoint(req.method, url.searchParams, { apiKey: readKey() });

    res.statusCode = result.status;
    for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
    res.end(JSON.stringify(result.body));
  };
}
