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
import { X402PaymentExecutor } from "./services/x402-payment-executor";
import { DeterministicTaskRelevanceScorer } from "./services/task-relevance";

export interface AppContext {
  agentRepository: InMemoryAgentRepository;
  taskRepository: InMemoryTaskRepository;
  policyRepository: InMemoryPolicyRepository;
  providerRepository: InMemoryProviderRepository;
  evaluationService: EvaluationService;
  paymentOrchestrator: PaymentOrchestrator;
  providerDiscoveryService: ProviderDiscoveryService;
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
  const paymentExecutor = new X402PaymentExecutor();
  const paymentOrchestrator = new PaymentOrchestrator(evaluationService, paymentExecutor);
  const providerRegistry = new ProviderRegistry();
  const providerDiscoveryService = new ProviderDiscoveryService(providerRegistry);

  return {
    agentRepository,
    taskRepository,
    policyRepository,
    providerRepository,
    evaluationService,
    paymentOrchestrator,
    providerDiscoveryService
  };
};
