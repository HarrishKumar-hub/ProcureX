import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createResourceRouter } from "./routes";
import { initializeResourceServer } from "./middleware";
import { config } from "./config";

const originalFetch = global.fetch;
global.fetch = async (url: any, options?: any) => {
  const urlStr = url.toString();
  if (urlStr.includes("goplausible.xyz")) {
    console.log(`\n--- RESOURCE SERVER OUTGOING to ${urlStr} ---`);
    if (options?.body) {
      try {
        console.log("REQUEST BODY:", JSON.stringify(JSON.parse(options.body), null, 2));
      } catch {
        console.log("REQUEST BODY (RAW):", options.body);
      }
    }
    try {
      const response = await originalFetch(url, options);
      const clonedRes = response.clone();
      console.log(`--- RESPONSE STATUS: ${response.status} ---`);
      console.log("RESPONSE BODY:", await clonedRes.text());
      return response;
    } catch (err: any) {
      console.error("OUTGOING FETCH ERROR:", err.message);
      throw err;
    }
  }
  return originalFetch(url, options);
};

const start = async () => {
  // Initialize x402 with facilitator FIRST
  await initializeResourceServer();

  const app = new Hono();
  
  app.get("/health", (c) => c.json({ status: "ok", service: "ProcureX x402 Resource Server" }));
  app.route("/", createResourceRouter());

  serve({
    fetch: app.fetch,
    port: config.port
  }, (info) => {
    console.log(`x402 Resource Server listening on port ${info.port}`);
    console.log(`AVM Receiver Address: ${config.avmAddress}`);
  });
};

start();
