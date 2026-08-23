import { demoAgent, demoPolicy, demoProviders, demoTasks } from "./data/demo-data";
import { ProviderRegistry } from "./providers/provider-registry";
import {
  InMemoryAgentRepository,
  InMemoryDecisionRepository,
  InMemoryPaymentRequestRepository,
  InMemoryPolicyRepository,
  InMemoryProviderRepository,
  InMemoryTaskRepository
} from "./repositories/in-memory-repositories";
import { EconomicPolicyEngine } from "./services/economic-policy-engine";
import { EvaluationService } from "./services/evaluation-service";
import { PaymentOrchestrator } from "./services/payment-orchestrator";
import { ProviderDiscoveryService } from "./services/provider-discovery-service";
import { RealPaymentExecutor } from "./services/real-payment-executor";
import { MockPaymentExecutor } from "./services/payment-executor";
import { DeterministicTaskRelevanceScorer } from "./services/task-relevance";
import { AgentPlanner } from "./services/agent-planner";
import { AgentOrchestrator } from "./services/agent-orchestrator";

export interface AppContext {
  agentRepository: InMemoryAgentRepository;
  taskRepository: InMemoryTaskRepository;
  policyRepository: InMemoryPolicyRepository;
  providerRepository: InMemoryProviderRepository;
  evaluationService: EvaluationService;
  paymentOrchestrator: PaymentOrchestrator;
  providerDiscoveryService: ProviderDiscoveryService;
  agentPlanner: AgentPlanner;
  agentOrchestrator: AgentOrchestrator;
}

export const createAppContext = (): AppContext => {
  const agentRepository = new InMemoryAgentRepository();
  const taskRepository = new InMemoryTaskRepository();
  const policyRepository = new InMemoryPolicyRepository();
  const providerRepository = new InMemoryProviderRepository();
  const paymentRequestRepository = new InMemoryPaymentRequestRepository();
  const decisionRepository = new InMemoryDecisionRepository();

  policyRepository.create(demoPolicy);
  agentRepository.create(demoAgent);
  demoTasks.forEach((task) => taskRepository.create(task));
  demoProviders.forEach((provider) => providerRepository.create(provider));

  const policyEngine = new EconomicPolicyEngine(new DeterministicTaskRelevanceScorer());
  const evaluationService = new EvaluationService(
    agentRepository,
    taskRepository,
    policyRepository,
    providerRepository,
    paymentRequestRepository,
    decisionRepository,
    policyEngine
  );
  const enabled = process.env.X402_ENABLED !== "false";
  const paymentExecutor = enabled
    ? new RealPaymentExecutor()
    : new MockPaymentExecutor();
  const paymentOrchestrator = new PaymentOrchestrator(evaluationService, paymentExecutor);
  const providerRegistry = new ProviderRegistry();
  const providerDiscoveryService = new ProviderDiscoveryService(providerRegistry);

  const agentPlanner = new AgentPlanner();
  const agentOrchestrator = new AgentOrchestrator(
    agentPlanner,
    providerDiscoveryService,
    paymentOrchestrator,
    taskRepository,
    providerRepository
  );

  return {
    agentRepository,
    taskRepository,
    policyRepository,
    providerRepository,
    evaluationService,
    paymentOrchestrator,
    providerDiscoveryService,
    agentPlanner,
    agentOrchestrator
  };
};
