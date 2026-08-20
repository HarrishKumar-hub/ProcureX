import express from "express";
import cors from "cors";
import { createAppContext } from "./app-context";
import { createRouter } from "./api/routes";

export const createApp = () => {
  const app = express();
  const context = createAppContext();

  const corsOptions = { 
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
  };
  
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  
  app.use(express.json());
  app.use(createRouter(context));

  return app;
};
