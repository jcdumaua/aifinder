import http from "node:http";

const SYNTHETIC_TOOL = Object.freeze({
  id: 1,
  slug: "synthetic-tool",
  name: "Synthetic Tool",
  category: "Chatbots",
  description: "Fabricated browser-QA-only tool.",
  website: "https://example.invalid",
  logo_url: "/icon-192x192.png",
  pricing: "Free",
  featured: true,
  platforms: ["Web"],
  best_for: "Fabricated browser QA",
  use_cases: ["Synthetic browser QA"],
  ios: null,
  android: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
});

function jsonResponse(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Range": "0-0/1",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-profile, x-client-info",
  });
  response.end(body);
}

export async function startSyntheticSupabaseStub() {
  const metrics = {
    acceptedReads: 0,
    acceptedPreflights: 0,
    rejectedWrites: 0,
    rejectedUnknown: 0,
  };

  const server = http.createServer((request, response) => {
    const parsed = new URL(request.url || "/", "http://127.0.0.1");
    const isAllowedReadPath =
      parsed.pathname === "/rest/v1/public_safe_tools" ||
      parsed.pathname === "/rest/v1/homepage_control_configs";

    if (request.method === "OPTIONS" && isAllowedReadPath) {
      metrics.acceptedPreflights += 1;
      response.writeHead(204, {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, apikey, content-profile, x-client-info",
      });
      response.end();
      return;
    }

    if (request.method !== "GET") {
      metrics.rejectedWrites += 1;
      jsonResponse(response, 405, { code: "SYNTHETIC_WRITE_REJECTED" });
      return;
    }

    if (parsed.pathname === "/health") {
      metrics.acceptedReads += 1;
      jsonResponse(response, 200, { status: "ok" });
      return;
    }

    if (parsed.pathname === "/rest/v1/public_safe_tools") {
      metrics.acceptedReads += 1;
      jsonResponse(response, 200, [SYNTHETIC_TOOL]);
      return;
    }

    if (parsed.pathname === "/rest/v1/homepage_control_configs") {
      metrics.acceptedReads += 1;
      jsonResponse(response, 200, null);
      return;
    }

    metrics.rejectedUnknown += 1;
    jsonResponse(response, 404, { code: "SYNTHETIC_ROUTE_REJECTED" });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("SYNTHETIC_STUB_BIND_FAILED");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    metrics,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
