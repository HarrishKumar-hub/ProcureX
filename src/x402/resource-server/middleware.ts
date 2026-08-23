import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
// @ts-ignore
import { ExactAvmScheme } from "@x402/avm/exact/server";
import { ALGORAND_TESTNET_CAIP2 } from "@x402/avm";
import { config } from "./config";

const facilitatorClient = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
const avmScheme = new ExactAvmScheme();

export const ALGORAND_TESTNET_CAIP2_FULL = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";

export const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(ALGORAND_TESTNET_CAIP2_FULL, avmScheme);

export const initializeResourceServer = async () => {
  try {
    await resourceServer.initialize();
  } catch (err) {
    console.warn("Facilitator unreachable:", err);
  }

  // Override getSupportedKind to always return a valid kind
  (resourceServer as any).getSupportedKind = (x402Version: number, network: string, scheme: string) => {
    return { x402Version, network, scheme };
  };
  // Override getFacilitatorExtensions to return empty array
  (resourceServer as any).getFacilitatorExtensions = () => [];
  console.log("x402 Resource Server initialized — getSupportedKind overridden");
};

// @ts-ignore
const routes = {
  "/services/ip-reputation": { accepts: [{ scheme: "exact", network: ALGORAND_TESTNET_CAIP2_FULL, payTo: config.avmAddress, price: { amount: "10000", asset: config.usdcAssetId }, extra: { feePayer: "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA" } }] },
  "/services/threat-intelligence": { accepts: [{ scheme: "exact", network: ALGORAND_TESTNET_CAIP2_FULL, payTo: config.avmAddress, price: { amount: "20000", asset: config.usdcAssetId }, extra: { feePayer: "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA" } }] },
  "/services/malware-analysis": { accepts: [{ scheme: "exact", network: ALGORAND_TESTNET_CAIP2_FULL, payTo: config.avmAddress, price: { amount: "30000", asset: config.usdcAssetId }, extra: { feePayer: "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA" } }] }
};

export const x402Middleware = paymentMiddleware(routes as any, resourceServer, undefined, undefined, false);
