import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
// @ts-ignore
import { ExactAvmScheme } from "@x402/avm/exact/server";
import { ALGORAND_TESTNET_CAIP2 } from "@x402/avm";
import { config } from "./config";

// Setup HTTP client to GoPlausible facilitator
const facilitatorClient = new HTTPFacilitatorClient({ url: config.facilitatorUrl });

// Create the ExactAvmScheme for the server
const avmScheme = new ExactAvmScheme();

// Create the resource server
export const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(ALGORAND_TESTNET_CAIP2, avmScheme);

// Define payment routes and their requirements
// @ts-ignore
const routes = {
  "/services/ip-reputation": { accepts: [{ scheme: "exact", network: ALGORAND_TESTNET_CAIP2, payTo: config.avmAddress, price: { amount: "0.01", asset: config.usdcAssetId } }] },
  "/services/threat-intelligence": { accepts: [{ scheme: "exact", network: ALGORAND_TESTNET_CAIP2, payTo: config.avmAddress, price: { amount: "0.02", asset: config.usdcAssetId } }] },
  "/services/malware-analysis": { accepts: [{ scheme: "exact", network: ALGORAND_TESTNET_CAIP2, payTo: config.avmAddress, price: { amount: "0.03", asset: config.usdcAssetId } }] }
};

// Setup the x402 payment middleware
export const x402Middleware = paymentMiddleware(routes as any, resourceServer, undefined, undefined, false);
