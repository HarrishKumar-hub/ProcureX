import { Hono } from "hono";
import { x402Middleware } from "./middleware";
import { discoveryMetadata } from "./discovery";

// Mock implementation of the actual provider logic
const executeIpReputation = (ip: string) => {
  return {
    ip,
    riskLevel: "low",
    score: 12,
    threatTypes: []
  };
};

const executeThreatIntelligence = (ip: string) => {
  return {
    ip,
    threatLevel: "critical",
    knownAttacker: true,
    associatedMalware: ["TrickBot", "Emotet"]
  };
};

const executeMalwareAnalysis = (ip: string) => {
  return {
    ip,
    malwareScore: 95,
    recentActivity: true,
    family: "Ransomware"
  };
};

export const createResourceRouter = () => {
  const app = new Hono();

  // Add the bazaar discovery endpoint
  app.get("/.well-known/bazaar", (c) => c.json(discoveryMetadata));

  // The protected endpoints
  app.post("/services/ip-reputation", x402Middleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = body.ip || "unknown";
    return c.json({ result: executeIpReputation(ip) });
  });

  app.post("/services/threat-intelligence", x402Middleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = body.ip || "unknown";
    return c.json({ result: executeThreatIntelligence(ip) });
  });

  app.post("/services/malware-analysis", x402Middleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = body.ip || "unknown";
    return c.json({ result: executeMalwareAnalysis(ip) });
  });

  return app;
};
