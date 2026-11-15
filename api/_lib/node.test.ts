// @vitest-environment node
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { toNodeHandler } from "./node";

/** Just enough of a response to see what the handler wrote. */
function fakeResponse() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 0,
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    end: vi.fn(),
  };
  return { res: res as unknown as ServerResponse, raw: res, headers };
}

describe("toNodeHandler", () => {
  it("passes the method and the query to the endpoint and writes its result", async () => {
    const endpoint = vi.fn(async () => ({
      status: 201,
      headers: { "X-Test": "yes" },
      body: { ok: true },
    }));
    const { res, raw, headers } = fakeResponse();
    const handler = toNodeHandler(endpoint, () => "the-key");

    await handler({ method: "GET", url: "/api/geocode?city=Lima&country=PE" } as IncomingMessage, res);

    expect(endpoint).toHaveBeenCalledOnce();
    const [method, query, deps] = endpoint.mock.calls[0] as unknown as [
      string,
      URLSearchParams,
      { apiKey: string },
    ];
    expect(method).toBe("GET");
    expect(query.get("city")).toBe("Lima");
    expect(query.get("country")).toBe("PE");
    expect(deps.apiKey).toBe("the-key");
    expect(raw.statusCode).toBe(201);
    expect(headers["X-Test"]).toBe("yes");
    expect(raw.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });

  it("reads the key on each request, so a changed environment is picked up", async () => {
    const endpoint = vi.fn(async () => ({ status: 200, headers: {}, body: null }));
    let key: string | undefined;
    const handler = toNodeHandler(endpoint, () => key);

    key = undefined;
    await handler({ method: "GET", url: "/" } as IncomingMessage, fakeResponse().res);
    key = "later";
    await handler({ method: "GET", url: "/" } as IncomingMessage, fakeResponse().res);

    const keys = endpoint.mock.calls.map((call) => (call as unknown as [string, URLSearchParams, { apiKey?: string }])[2].apiKey);
    expect(keys).toEqual([undefined, "later"]);
  });
});
