import { createApp } from "./app";
import { loadEnv } from "./config/env";

const start = () => {
  const app = createApp();
  const env = loadEnv();

  app.listen(env.port, () => {
    console.log(`ProcureX API listening on port ${env.port}`);
  });
};

start();
