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

  // Mount x402 resource router on main app BEFORE express.json()
  const resourceRouter = createResourceRouter();
  app.use((req, res, next) => {
    if (req.path.startsWith("/services/")) {
      const fullUrl = `http://localhost:3000${req.url}`;
      
      const headers = new Headers();
      Object.entries(req.headers).forEach(([k, v]) => {
        if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
      });

      let bodyData: any = undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        bodyData = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      }

      return resourceRouter.fetch(new Request(fullUrl, {
        method: req.method,
        headers,
        body: bodyData
      })).then(async (webRes) => {
        webRes.headers.forEach((val, key) => res.setHeader(key, val));
        res.status(webRes.status).send(await webRes.text());
      }).catch((err) => {
        console.error("Resource router error:", err);
        next(err);
      });
    }
    next();
  });

  app.use(express.json());
  app.use(createRouter(context));

  return app;
};
