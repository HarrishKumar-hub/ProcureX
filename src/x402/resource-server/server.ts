import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createResourceRouter } from "./routes";
import { initializeResourceServer } from "./middleware";
import { config } from "./config";

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
