import express from "express";
import cors from "cors";
import { createAppContext } from "./app-context";
import { createRouter } from "./api/routes";
import { createResourceRouter } from "./x402/resource-server/routes";
import { initializeResourceServer } from "./x402/resource-server/middleware";

export const createApp = () => {
  const app = express();
  const context = createAppContext();

  // Initialize x402 resource server middleware
  initializeResourceServer().catch((err) => console.error("x402 resource server init error:", err));

  const corsOptions = { 
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'payment-signature', 'x-payment'] 
  };
  
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  
  app.use(express.json());
  app.use(createRouter(context));

  // Mount x402 resource router on main app
  const resourceRouter = createResourceRouter();
  app.use((req, res, next) => {
    if (req.path.startsWith("/services/")) {
      return resourceRouter.fetch(new Request(new URL(req.url, `http://${req.headers.host}`).href, {
        method: req.method,
        headers: req.headers as any,
        body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined
      })).then(async (webRes) => {
        webRes.headers.forEach((val, key) => res.setHeader(key, val));
        res.status(webRes.status).send(await webRes.text());
      }).catch(next);
    }
    next();
  });

  return app;
};
