import {
  PaymentExecutionResult,
  PaymentExecutionMode,
  PaymentRequest
} from "../domain/types";
import { PaymentExecutor } from "./payment-executor";

interface X402ExecutorConfig {
  resourceUrl?: string;
  avmMnemonic?: string;
  enabled: boolean;
}

interface PaymentSettleResponse {
  success?: boolean;
  transaction?: string;
  network?: string;
}

type DynamicImportFn = (modulePath: string) => Promise<unknown>;

const dynamicImport: DynamicImportFn = new Function(
  "modulePath",
  "return import(modulePath)"
) as DynamicImportFn;

const isConfigured = (config: X402ExecutorConfig): boolean =>
  config.enabled && Boolean(config.resourceUrl && config.avmMnemonic);

export class X402PaymentExecutor implements PaymentExecutor {
  private readonly config: X402ExecutorConfig;

  constructor(config: Partial<X402ExecutorConfig> = {}) {
    this.config = {
      resourceUrl: config.resourceUrl ?? process.env.X402_RESOURCE_URL,
      avmMnemonic: config.avmMnemonic ?? process.env.X402_AVM_MNEMONIC,
      enabled: config.enabled ?? process.env.X402_ENABLED === "true"
    };
  }

  async execute(request: PaymentRequest): Promise<PaymentExecutionResult> {
    if (!isConfigured(this.config)) {
      return this.notConfiguredResult();
    }

    const mode: PaymentExecutionMode = "X402";

    try {
      const fetchClient = (await dynamicImport("@x402/fetch")) as {
        x402Client: new () => {
          register: (network: string, scheme: unknown) => void;
        };
        wrapFetchWithPayment: (fetchFn: typeof fetch, client: unknown) => typeof fetch;
        x402HTTPClient: new (client: unknown) => {
          getPaymentSettleResponse: (
            headerReader: (name: string) => string | null
          ) => PaymentSettleResponse;
        };
      };

      const avm = (await dynamicImport("@x402/avm")) as {
        toClientAvmSigner: (secretKey: string) => unknown;
        ExactAvmScheme: new (signer: unknown) => unknown;
        ALGORAND_TESTNET_CAIP2: string;
      };

      const cryptoUtils = (await dynamicImport("@algorandfoundation/algokit-utils/crypto")) as {
        ed25519SigningKeyFromWrappedSecret: (wrappedSeed: {
          unwrapEd25519Seed: () => Promise<Uint8Array>;
          wrapEd25519Seed: () => Promise<void>;
        }) => Promise<{ ed25519Pubkey: Uint8Array }>;
      };

      const algo25 = (await dynamicImport("@algorandfoundation/algokit-utils/algo25")) as {
        seedFromMnemonic: (mnemonic: string) => Uint8Array;
      };

      const secretKey = await this.getSecretKeyFromMnemonic(
        this.config.avmMnemonic as string,
        algo25.seedFromMnemonic,
        cryptoUtils.ed25519SigningKeyFromWrappedSecret
      );

      const avmSigner = avm.toClientAvmSigner(secretKey);
      const client = new fetchClient.x402Client();
      client.register(avm.ALGORAND_TESTNET_CAIP2, new avm.ExactAvmScheme(avmSigner));
      const fetchWithPayment = fetchClient.wrapFetchWithPayment(fetch, client);

      const endpointUrl = `${this.config.resourceUrl}/services/${request.serviceCategory.replace("_", "-")}`;

      const response = await fetchWithPayment(endpointUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId: request.taskId,
          providerId: request.providerId,
          service: request.service,
          serviceCategory: request.serviceCategory,
          amount: request.amount,
          currency: request.currency,
          reason: request.reason
        })
      });

      if (!response.ok) {
        const responseText = await response.text();
        return {
          paymentStatus: "FAILED",
          executionMode: mode,
          message: `x402 execution failed with status ${response.status}`,
          providerResponse: responseText
        };
      }

      const paymentResponse = new fetchClient.x402HTTPClient(client).getPaymentSettleResponse(
        (name: string) => response.headers.get(name)
      );
      const responseBody = await this.safeParseJson(response);

      if (!paymentResponse?.success) {
        return {
          paymentStatus: "FAILED",
          executionMode: mode,
          message: "x402 call completed but settlement headers did not confirm success",
          providerResponse: responseBody
        };
      }

      return {
        paymentStatus: "PAID",
        executionMode: mode,
        message: "x402 payment settled successfully.",
        transactionId: paymentResponse.transaction,
        network: paymentResponse.network,
        providerResponse: responseBody
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown x402 execution failure";
      return {
        paymentStatus: "FAILED",
        executionMode: mode,
        message: `x402 execution failed: ${message}`
      };
    }
  }

  private notConfiguredResult(): PaymentExecutionResult {
    return {
      paymentStatus: "NOT_CONFIGURED",
      executionMode: "MOCK",
      message: "Policy approved payment, but real x402 execution is not configured."
    };
  }

  private async safeParseJson(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return response.text();
    }
    return response.json();
  }

  private async getSecretKeyFromMnemonic(
    avmMnemonic: string,
    seedFromMnemonic: (mnemonic: string) => Uint8Array,
    ed25519SigningKeyFromWrappedSecret: (wrappedSeed: {
      unwrapEd25519Seed: () => Promise<Uint8Array>;
      wrapEd25519Seed: () => Promise<void>;
    }) => Promise<{ ed25519Pubkey: Uint8Array }>
  ): Promise<string> {
    const seed = seedFromMnemonic(avmMnemonic);
    const seedCopy = new Uint8Array(seed);

    const wrappedSecret = await ed25519SigningKeyFromWrappedSecret({
      unwrapEd25519Seed: async () => seed,
      wrapEd25519Seed: async () => undefined
    });

    return Buffer.concat([Buffer.from(seedCopy), Buffer.from(wrappedSecret.ed25519Pubkey)]).toString(
      "base64"
    );
  }
}
