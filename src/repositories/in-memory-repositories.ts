import {
  AgentRepository,
  DecisionRepository,
  PaymentRequestRepository,
  PolicyRepository,
  ProviderRepository,
  TaskRepository
} from "../domain/repositories";
import {
  Agent,
  Decision,
  EconomicPolicy,
  PaymentRequest,
  Provider,
  Task
} from "../domain/types";

export class InMemoryAgentRepository implements AgentRepository {
  private readonly agents = new Map<string, Agent>();

  create(agent: Agent): Agent {
    this.agents.set(agent.id, agent);
    return agent;
  }

  getById(id: string): Agent | undefined {
    return this.agents.get(id);
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  create(task: Task): Task {
    this.tasks.set(task.id, task);
    return task;
  }

  getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  update(task: Task): Task {
    this.tasks.set(task.id, task);
    return task;
  }
}

export class InMemoryPolicyRepository implements PolicyRepository {
  private readonly policies = new Map<string, EconomicPolicy>();

  create(policy: EconomicPolicy): EconomicPolicy {
    this.policies.set(policy.id, policy);
    return policy;
  }

  getById(id: string): EconomicPolicy | undefined {
    return this.policies.get(id);
  }
}

export class InMemoryProviderRepository implements ProviderRepository {
  private readonly providers = new Map<string, Provider>();

  create(provider: Provider): Provider {
    this.providers.set(provider.id, provider);
    return provider;
  }

  getById(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  list(): Provider[] {
    return [...this.providers.values()];
  }
}

export class InMemoryPaymentRequestRepository implements PaymentRequestRepository {
  private readonly paymentRequests: PaymentRequest[] = [];

  create(paymentRequest: PaymentRequest): PaymentRequest {
    this.paymentRequests.push(paymentRequest);
    return paymentRequest;
  }

  list(): PaymentRequest[] {
    return [...this.paymentRequests];
  }
}

export class InMemoryDecisionRepository implements DecisionRepository {
  private readonly decisions: Decision[] = [];

  create(decision: Decision): Decision {
    this.decisions.push(decision);
    return decision;
  }

  listByTaskId(taskId: string): Decision[] {
    return this.decisions.filter((decision) => decision.taskId === taskId);
  }
}
