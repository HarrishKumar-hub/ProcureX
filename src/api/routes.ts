import { Request, Response, Router } from "express";
import { AppContext } from "../app-context";
import {
  EvaluatePaymentInput,
  NewAgentInput,
  NewProviderInput,
  NewTaskInput
} from "../domain/types";
import { SupportedServiceCategory } from "../providers/provider-types";

const createId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

const badRequest = (response: Response, message: string) =>
  response.status(400).json({ error: message });

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);



export const createRouter = (context: AppContext): Router => {
  const router = Router();

  router.get("/", (_request, response) => {
    response.json({ status: "ok", service: "ProcureX Economic Control Plane API", health: "/health" });
  });

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "ProcureX backend" });
  });

  router.post("/agents", (request: Request, response: Response) => {
    const payload = request.body as Partial<NewAgentInput>;
    if (
      !isNonEmptyString(payload.name) ||
      !isNonEmptyString(payload.description) ||
      !isNonEmptyString(payload.policyId) ||
      !isNonEmptyString(payload.status)
    ) {
      return badRequest(response, "Invalid agent payload");
    }

    const agent = context.agentRepository.create({
      id: payload.id ?? createId("agent"),
      name: payload.name,
      description: payload.description,
      walletAddress: payload.walletAddress,
      policyId: payload.policyId,
      status: payload.status as "ACTIVE" | "PAUSED" | "DISABLED"
    });

    response.status(201).json(agent);
  });

  router.get("/agents/:id", (request: Request, response: Response) => {
    const { id } = request.params;
    if (!isNonEmptyString(id)) {
      return badRequest(response, "Invalid agent id");
    }
    const agent = context.agentRepository.getById(id);
    if (!agent) {
      return response.status(404).json({ error: "Agent not found" });
    }
    response.json(agent);
  });

  router.post("/tasks", (request: Request, response: Response) => {
    const payload = request.body as Partial<NewTaskInput>;
    if (
      !isNonEmptyString(payload.agentId) ||
      !isNonEmptyString(payload.userIntent) ||
      !isNonEmptyString(payload.taskCategory) ||
      !isNumber(payload.budget)
    ) {
      return badRequest(response, "Invalid task payload");
    }

    const task = context.taskRepository.create({
      id: payload.id ?? createId("task"),
      agentId: payload.agentId,
      userIntent: payload.userIntent,
      taskCategory: payload.taskCategory,
      budget: payload.budget,
      spent: payload.spent ?? 0,
      status: payload.status ?? "OPEN"
    });

    response.status(201).json(task);
  });

  router.get("/tasks/:id", (request: Request, response: Response) => {
    const { id } = request.params;
    if (!isNonEmptyString(id)) {
      return badRequest(response, "Invalid task id");
    }
    const task = context.taskRepository.getById(id);
    if (!task) {
      return response.status(404).json({ error: "Task not found" });
    }
    response.json(task);
  });

  router.post("/providers", (request: Request, response: Response) => {
    const payload = request.body as Partial<NewProviderInput>;
    if (
      !isNonEmptyString(payload.name) ||
      !isNonEmptyString(payload.serviceCategory) ||
      !isNumber(payload.trustScore) ||
      !isNumber(payload.reputationScore) ||
      !isNumber(payload.historicalAveragePrice) ||
      !isNumber(payload.currentPrice) ||
      !isNumber(payload.successRate) ||
      !isNonEmptyString(payload.status)
    ) {
      return badRequest(response, "Invalid provider payload");
    }

    const provider = context.providerRepository.create({
      id: payload.id ?? createId("provider"),
      name: payload.name,
      serviceCategory: payload.serviceCategory,
      trustScore: payload.trustScore,
      reputationScore: payload.reputationScore,
      historicalAveragePrice: payload.historicalAveragePrice,
      currentPrice: payload.currentPrice,
      successRate: payload.successRate,
      status: payload.status as "ACTIVE" | "SUSPENDED"
    });

    response.status(201).json(provider);
  });

  router.get("/providers", (_request: Request, response: Response) => {
    response.json(context.providerRepository.list());
  });

  router.get("/services", (_request: Request, response: Response) => {
    response.json(context.providerDiscoveryService.listServiceCatalog());
  });

  router.post("/agent/investigate", async (request: Request, response: Response) => {
    const payload = request.body;
    if (
      !isNonEmptyString(payload.userIntent) ||
      !isNonEmptyString(payload.targetIp) ||
      !isNumber(payload.budget)
    ) {
      return badRequest(response, "Invalid agent investigation payload");
    }

    try {
      const result = await context.agentOrchestrator.executeInvestigation({
        userIntent: payload.userIntent,
        targetIp: payload.targetIp,
        budget: payload.budget,
        agentId: "agent-security-01", // Assuming demo agent
        simulateAttack: payload.simulateAttack
      });
      response.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent investigation failed";
      response.status(500).json({ error: message });
    }
  });
  router.post("/payment-requests/evaluate", (request: Request, response: Response) => {
    const payload = request.body as Partial<EvaluatePaymentInput>;
    if (
      !isNonEmptyString(payload.taskId) ||
      !isNonEmptyString(payload.providerId) ||
      !isNonEmptyString(payload.service) ||
      !isNonEmptyString(payload.serviceCategory) ||
      !isNumber(payload.amount) ||
      !isNonEmptyString(payload.currency) ||
      !isNonEmptyString(payload.reason)
    ) {
      return badRequest(response, "Invalid payment evaluation payload");
    }

    try {
      const result = context.evaluationService.evaluatePayment({
        taskId: payload.taskId,
        providerId: payload.providerId,
        service: payload.service,
        serviceCategory: payload.serviceCategory,
        amount: payload.amount,
        currency: payload.currency,
        reason: payload.reason
      });

      response.json({
        decision: result.decision.decision,
        riskAssessment: result.riskAssessment,
        explanation: result.explanation
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment evaluation failed";
      response.status(400).json({ error: message });
    }
  });

  router.post("/payment-requests/execute", async (request: Request, response: Response) => {
    const payload = request.body as Partial<EvaluatePaymentInput>;
    if (
      !isNonEmptyString(payload.taskId) ||
      !isNonEmptyString(payload.providerId) ||
      !isNonEmptyString(payload.service) ||
      !isNonEmptyString(payload.serviceCategory) ||
      !isNumber(payload.amount) ||
      !isNonEmptyString(payload.currency) ||
      !isNonEmptyString(payload.reason)
    ) {
      return badRequest(response, "Invalid payment execution payload");
    }

    try {
      const result = await context.paymentOrchestrator.executePayment({
        taskId: payload.taskId,
        providerId: payload.providerId,
        service: payload.service,
        serviceCategory: payload.serviceCategory,
        amount: payload.amount,
        currency: payload.currency,
        reason: payload.reason
      });

      response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment execution failed";
      response.status(400).json({ error: message });
    }
  });

  router.get("/decisions/:taskId", (request: Request, response: Response) => {
    const { taskId } = request.params;
    if (!isNonEmptyString(taskId)) {
      return badRequest(response, "Invalid task id");
    }
    const decisions = context.evaluationService.listDecisionsByTaskId(taskId);
    response.json({ taskId, decisions });
  });

  return router;
};
