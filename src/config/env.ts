import { config } from "dotenv";

config();

export interface EnvConfig {
  port: number;
}

export const loadEnv = (): EnvConfig => {
  const rawPort = process.env.PORT ?? "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return { port };
};
