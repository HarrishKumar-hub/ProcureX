import dotenv from "dotenv";

dotenv.config();

export const config = {
  avmAddress: process.env.AVM_ADDRESS || "",
  facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.goplausible.xyz",
  usdcAssetId: process.env.USDC_ASSET_ID || "10458941",
  port: process.env.RESOURCE_SERVER_PORT ? parseInt(process.env.RESOURCE_SERVER_PORT, 10) : 4021
};

if (!config.avmAddress) {
  console.warn("WARNING: AVM_ADDRESS is not set. Resource server will not be able to receive payments.");
}
