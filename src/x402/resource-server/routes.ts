import { Hono } from "hono";
import { x402Middleware } from "./middleware";
import { discoveryMetadata } from "./discovery";

// ── Real API calls with graceful fallback ──────────────────────────────

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * IP Reputation via AbuseIPDB
 * https://docs.abuseipdb.com/#check-endpoint
 */
const executeIpReputation = async (ip: string) => {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) {
    return { ip, source: "AbuseIPDB", error: "ABUSEIPDB_API_KEY not configured", fallback: true };
  }
  try {
    const res = await fetchWithTimeout(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`,
      { headers: { Key: apiKey, Accept: "application/json" } }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ip, source: "AbuseIPDB", error: `API returned ${res.status}: ${text}`, fallback: true };
    }
    const json = await res.json();
    const d = json.data;
    return {
      ip,
      source: "AbuseIPDB",
      abuseConfidenceScore: d.abuseConfidenceScore,
      totalReports: d.totalReports,
      countryCode: d.countryCode,
      usageType: d.usageType,
      isp: d.isp,
      domain: d.domain,
      isWhitelisted: d.isWhitelisted,
      lastReportedAt: d.lastReportedAt,
      riskLevel: d.abuseConfidenceScore >= 75 ? "critical" : d.abuseConfidenceScore >= 40 ? "high" : d.abuseConfidenceScore >= 15 ? "medium" : "low"
    };
  } catch (e: any) {
    return { ip, source: "AbuseIPDB", error: e.name === "AbortError" ? "Request timed out (5s)" : e.message, fallback: true };
  }
};

/**
 * Threat Intelligence via VirusTotal
 * https://docs.virustotal.com/reference/ip-info
 */
const executeThreatIntelligence = async (ip: string) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { ip, source: "VirusTotal", error: "VIRUSTOTAL_API_KEY not configured", fallback: true };
  }
  try {
    const res = await fetchWithTimeout(
      `https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(ip)}`,
      { headers: { "x-apikey": apiKey, Accept: "application/json" } }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ip, source: "VirusTotal", error: `API returned ${res.status}: ${text}`, fallback: true };
    }
    const json = await res.json();
    const attrs = json.data?.attributes || {};
    const stats = attrs.last_analysis_stats || {};
    return {
      ip,
      source: "VirusTotal",
      reputation: attrs.reputation,
      country: attrs.country,
      asOwner: attrs.as_owner,
      network: attrs.network,
      lastAnalysisStats: {
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
        timeout: stats.timeout || 0
      },
      threatLevel: (stats.malicious || 0) >= 10 ? "critical" : (stats.malicious || 0) >= 5 ? "high" : (stats.malicious || 0) >= 1 ? "medium" : "low",
      totalEngines: Object.values(stats).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
    };
  } catch (e: any) {
    return { ip, source: "VirusTotal", error: e.name === "AbortError" ? "Request timed out (5s)" : e.message, fallback: true };
  }
};

/**
 * Malware / Host Analysis via Shodan
 * https://developer.shodan.io/api
 */
const executeMalwareAnalysis = async (ip: string) => {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey) {
    return { ip, source: "Shodan", error: "SHODAN_API_KEY not configured", fallback: true };
  }
  try {
    const res = await fetchWithTimeout(
      `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${apiKey}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ip, source: "Shodan", error: `API returned ${res.status}: ${text}`, fallback: true };
    }
    const json = await res.json();
    return {
      ip,
      source: "Shodan",
      ports: json.ports || [],
      hostnames: json.hostnames || [],
      os: json.os || "Unknown",
      organization: json.org || "Unknown",
      isp: json.isp || "Unknown",
      vulns: json.vulns || [],
      tags: json.tags || [],
      lastUpdate: json.last_update,
      openPorts: (json.ports || []).length,
      hasCVEs: (json.vulns || []).length > 0,
      severity: (json.vulns || []).length > 5 ? "critical" : (json.vulns || []).length > 0 ? "high" : (json.ports || []).length > 20 ? "medium" : "low"
    };
  } catch (e: any) {
    return { ip, source: "Shodan", error: e.name === "AbortError" ? "Request timed out (5s)" : e.message, fallback: true };
  }
};

// ── Route definitions ──────────────────────────────────────────────────

export const createResourceRouter = () => {
  const app = new Hono();

  // Add the bazaar discovery endpoint
  app.get("/.well-known/bazaar", (c) => c.json(discoveryMetadata));

  // The protected endpoints — payment is settled by x402Middleware BEFORE these run
  app.post("/services/ip-reputation", x402Middleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = body.targetIp || body.ip || "unknown";
    const result = await executeIpReputation(ip);
    return c.json({ result });
  });

  app.post("/services/threat-intelligence", x402Middleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = body.targetIp || body.ip || "unknown";
    const result = await executeThreatIntelligence(ip);
    return c.json({ result });
  });

  app.post("/services/malware-analysis", x402Middleware, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const ip = body.targetIp || body.ip || "unknown";
    const result = await executeMalwareAnalysis(ip);
    return c.json({ result });
  });

  return app;
};
