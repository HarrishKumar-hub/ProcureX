import {
  Agent,
  Decision,
  EconomicPolicy,
  PaymentRequest,
  Provider,
  Task
} from "./types";

export interface AgentRepository {
  create(agent: Agent): Agent;
  getById(id: string): Agent | undefined;
}

export interface TaskRepository {
  create(task: Task): Task;
  getById(id: string): Task | undefined;
  update(task: Task): Task;
}

export interface PolicyRepository {
  create(policy: EconomicPolicy): EconomicPolicy;
  getById(id: string): EconomicPolicy | undefined;
}

export interface ProviderRepository {
  create(provider: Provider): Provider;
  getById(id: string): Provider | undefined;
  list(): Provider[];
}

export interface PaymentRequestRepository {
  create(paymentRequest: PaymentRequest): PaymentRequest;
  list(): PaymentRequest[];
}

export interface DecisionRepository {
  create(decision: Decision): Decision;
  listByTaskId(taskId: string): Decision[];
}
