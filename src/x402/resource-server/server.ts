import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createResourceRouter } from "./routes";
import { config } from "./config";

const start = () => {
  const app = new Hono();
  
  // Health check for the resource server
  app.get("/health", (c) => c.json({ status: "ok", service: "ProcureX x402 Resource Server" }));

  // Mount the resource routes
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
