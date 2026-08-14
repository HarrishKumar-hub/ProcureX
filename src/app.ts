import express from "express";
import { createAppContext } from "./app-context";
import { createRouter } from "./api/routes";

export const createApp = () => {
  const app = express();
  const context = createAppContext();

  app.use(express.json());
  app.use(createRouter(context));

  return app;
};
