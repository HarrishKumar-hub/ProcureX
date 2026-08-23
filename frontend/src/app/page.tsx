"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Activity, Database, Banknote, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Cpu, Gauge, Users, Wallet } from "lucide-react";
import { runInvestigation, OrchestrationResult } from "@/lib/api";
import { ProviderLeaderboard } from "./ProviderLeaderboard";

const AGENT_ADDRESS = "4U63RU6G52MUBG4QTYAJKG4ZBZ55Z4BXQUA3RTDNLVTOV7KLTWZNKKRM7I";

export default function Dashboard() {
  const [targetIp, setTargetIp] = useState("185.10.20.30");
  const [simulateAttack, setSimulateAttack] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const [feedSteps, setFeedSteps] = useState<Array<{ type: string; message: string; riskBreakdown?: any }>>([]);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`https://testnet-idx.algonode.cloud/v2/accounts/${AGENT_ADDRESS}`);
      if (res.ok) {
        const data = await res.json();
        const usdcAsset = (data.account?.assets || []).find((a: any) => a["asset-id"] === 10458941);
        if (usdcAsset) {
          const formatted = (usdcAsset.amount / 1_000_000).toFixed(2);
          setWalletBalance(formatted);
        }
      }
    } catch {
      // Graceful fallback if indexer is slow
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleRun = async () => {
    setIsInvestigating(true);
    setResult(null);
    setError(null);
    setFeedSteps([]);

    setFeedSteps((prev) => [...prev, { type: "PLANNING", message: `Analyzing intent: "Investigate suspicious IP ${targetIp}"...` }]);

    try {
      await new Promise((r) => setTimeout(r, 600));

      const data = await runInvestigation(targetIp, 0.2, simulateAttack);

      for (const blocked of data.securityIncidentsBlocked) {
        setFeedSteps((prev) => [...prev, { type: "DISCOVERY", message: `Discovered candidate: ${blocked.providerId}` }]);
        await new Promise((r) => setTimeout(r, 800));
        setFeedSteps((prev) => [...prev, { type: "BLOCKED", message: `Payment BLOCKED: ${blocked.providerId} ($${blocked.amount?.toFixed(2) ?? "?"})`, riskBreakdown: blocked.riskBreakdown }]);
        await new Promise((r) => setTimeout(r, 600));
        setFeedSteps((prev) => [...prev, { type: "RECOVERY", message: `Autonomous Fallback: Retrying with next provider` }]);
        await new Promise((r) => setTimeout(r, 600));
      }

      for (const step of data.stepsExecuted) {
        setFeedSteps((prev) => [...prev, { type: "DISCOVERY", message: `Discovered candidate for ${step.category}: ${step.providerId}` }]);
        await new Promise((r) => setTimeout(r, 600));
        setFeedSteps((prev) => [...prev, { type: "APPROVED", message: `Payment APPROVED for ${step.providerId} ($${step.cost.toFixed(2)})`, riskBreakdown: step.riskBreakdown }]);
        await new Promise((r) => setTimeout(r, 600));
        setFeedSteps((prev) => [...prev, { type: "EXECUTION", message: `Successfully executed ${step.category}.` }]);
        await new Promise((r) => setTimeout(r, 600));
      }

      setResult(data);
      fetchBalance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInvestigating(false);
    }
  };

  const iconFor = (type: string) => {
    switch (type) {
      case "PLANNING": return <Activity className="w-3.5 h-3.5" />;
      case "DISCOVERY": return <Database className="w-3.5 h-3.5" />;
      case "APPROVED": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "BLOCKED": return <XCircle className="w-3.5 h-3.5" />;
      case "RECOVERY": return <RefreshCw className="w-3.5 h-3.5" />;
      case "EXECUTION": return <Banknote className="w-3.5 h-3.5" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const colorFor = (type: string) => {
    switch (type) {
      case "PLANNING": return "text-blue-600 bg-blue-50";
      case "DISCOVERY": return "text-neutral-500 bg-neutral-100";
      case "APPROVED": return "text-emerald-700 bg-emerald-50";
      case "BLOCKED": return "text-red-700 bg-red-50";
      case "RECOVERY": return "text-amber-700 bg-amber-50";
      case "EXECUTION": return "text-brand-700 bg-brand-50";
      default: return "text-neutral-500 bg-neutral-100";
    }
  };

  const pct = result ? Math.min(100, Math.round((result.totalSpent / result.budget) * 100)) : 0;
  const isMalicious = result?.finalReport.verdict === "MALICIOUS";
  const ringColor = isMalicious ? "#dc2626" : "#059669";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-[1500px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-neutral-900 leading-none">ProcureX</div>
            <div className="text-xs text-neutral-500 mt-0.5">Economic Control Plane</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white rounded-full ring-1 ring-neutral-200 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-neutral-600">Algorand TestNet</span>
          </div>

          {/* Live Agent Wallet Header Card */}
          <a
            href={`https://lora.algokit.io/testnet/account/${AGENT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-white hover:bg-neutral-50 rounded-full ring-1 ring-neutral-200 pl-2.5 pr-4 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-mono font-semibold text-neutral-900">
                {AGENT_ADDRESS.slice(0, 4)}...{AGENT_ADDRESS.slice(-4)}
              </div>
              <div className="text-[11px] font-medium text-emerald-600">
                {walletBalance ? `${walletBalance} USDC` : "Loading..."}
              </div>
            </div>
          </a>

          <div className="flex items-center gap-2.5 bg-white rounded-full ring-1 ring-neutral-200 pl-2 pr-4 py-1.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-neutral-900">SecurityAgent-01</div>
              <div className="text-[11px] text-brand-600">$0.20 / task</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-8 pb-10 space-y-5">

        {/* Hero command bar */}
        <section className="bg-white rounded-[28px] ring-1 ring-neutral-200/80 p-8">
          <p className="text-sm text-neutral-400 mb-1">Autonomous Investigation</p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-5">Ready when you are.</h1>
          <div className="flex items-center gap-2 bg-neutral-50 rounded-full ring-1 ring-neutral-200 p-2 pl-6">
            <input
              type="text"
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              className="flex-1 bg-transparent border-none text-neutral-900 focus:outline-none focus:ring-0 font-mono text-base placeholder:text-neutral-400"
              placeholder="Enter target IP to investigate..."
            />
            <button
              onClick={handleRun}
              disabled={isInvestigating}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3.5 rounded-full font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isInvestigating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-brand-400 text-brand-400" />}
              {isInvestigating ? "Investigating" : "Run Investigation"}
            </button>
          </div>
        </section>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-5">

          {/* Guardrail tiles */}
          {[
            { label: "Max Single Tx", value: "$0.05", icon: <Gauge className="w-4 h-4" /> },
            { label: "Min Trust Score", value: "90/100", icon: <ShieldCheck className="w-4 h-4" /> },
            { label: "Anomaly Cap", value: "5x", icon: <AlertTriangle className="w-4 h-4" /> },
            { label: "Max Velocity", value: "10/min", icon: <Activity className="w-4 h-4" /> },
          ].map((tile, i) => (
            <div key={i} className="col-span-6 sm:col-span-3 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-5 h-[140px] flex flex-col justify-between">
              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">{tile.icon}</div>
              <div>
                <div className="text-2xl font-semibold text-neutral-900 font-mono-tight">{tile.value}</div>
                <div className="text-[11px] text-neutral-400 uppercase tracking-wide mt-1">{tile.label}</div>
              </div>
            </div>
          ))}

          {/* Attack simulator - dark card */}
          <div className="col-span-12 lg:col-span-4 bg-neutral-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-brand-400 mb-4">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-white mb-2">Attack Simulator</h2>
              <p className="text-[13px] text-neutral-400 leading-relaxed">
                Inject a malicious provider with a 100x markup ($2.00) to demonstrate the policy engine blocking payment.
              </p>
            </div>
            <label className="relative flex items-center justify-between cursor-pointer mt-5">
              <span className="text-sm font-medium text-white">Simulate Price Gouging</span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simulateAttack ? "bg-brand-500" : "bg-white/15"}`}>
                <input type="checkbox" className="sr-only" checked={simulateAttack} onChange={(e) => setSimulateAttack(e.target.checked)} />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${simulateAttack ? "translate-x-6" : "translate-x-1"}`} />
              </div>
            </label>
          </div>

          {/* Live event log */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-6 min-h-[420px] overflow-y-auto">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-5">Live Event Log</div>

            {error && (
              <div className="text-red-700 mb-4 bg-red-50 px-3.5 py-2.5 rounded-xl text-sm">{error}</div>
            )}

            <div className="space-y-4">
              {feedSteps.map((step, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex gap-3 items-start">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorFor(step.type)}`}>
                      {iconFor(step.type)}
                    </div>
                    <div className="pt-1.5 text-[13.5px] font-mono leading-snug">
                      <span className={
                        step.type === "APPROVED" || step.type === "EXECUTION" ? "text-emerald-700 font-medium" :
                        step.type === "BLOCKED" ? "text-red-700 font-medium" :
                        step.type === "PLANNING" ? "text-blue-700" : "text-neutral-600"
                      }>
                        {step.message}
                      </span>
                    </div>
                  </div>

                  {step.riskBreakdown && (step.type === "APPROVED" || step.type === "BLOCKED") && (
                    <div className="ml-11 flex flex-wrap gap-2 pt-0.5 pb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ring-1 ${step.riskBreakdown.trustScore.passed ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
                        Trust: {step.riskBreakdown.trustScore.value}/{step.riskBreakdown.trustScore.threshold} {step.riskBreakdown.trustScore.passed ? "✓" : "✗"}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ring-1 ${step.riskBreakdown.priceAnomaly.passed ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
                        Price: ${step.riskBreakdown.priceAnomaly.currentPrice} vs ${step.riskBreakdown.priceAnomaly.historicalAvg} avg ({step.riskBreakdown.priceAnomaly.multiplier}x) {step.riskBreakdown.priceAnomaly.passed ? "✓" : `✗ (cap: ${step.riskBreakdown.priceAnomaly.cap}x)`}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ring-1 ${step.riskBreakdown.velocity.passed ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}>
                        Velocity: {step.riskBreakdown.velocity.recentCount}/{step.riskBreakdown.velocity.limit} {step.riskBreakdown.velocity.passed ? "✓" : "✗"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {isInvestigating && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <span className="text-[13.5px] text-neutral-400 font-mono">Agent is thinking...</span>
                </div>
              )}
              {feedSteps.length === 0 && !isInvestigating && (
                <div className="text-sm text-neutral-400 py-10 text-center">Run an investigation to see the live trace.</div>
              )}
            </div>
          </div>

          {/* Verdict ring */}
          <div className="col-span-6 lg:col-span-4 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-6 flex flex-col items-center justify-center min-h-[220px]">
            {result ? (
              <div
                className="relative w-32 h-32 rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(${ringColor} ${pct}%, #eee 0)` }}
              >
                <div className="absolute inset-[6px] bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase text-neutral-400 tracking-wide">Verdict</span>
                  <span className="text-base font-bold" style={{ color: ringColor }}>{result.finalReport.verdict}</span>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-neutral-200 flex items-center justify-center text-center text-xs text-neutral-400 px-4">
                Verdict appears here
              </div>
            )}
          </div>

          {/* Financial stat pills */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl ring-1 ring-neutral-200/80 p-4">
              <Banknote className="w-4 h-4 text-brand-600 mb-3" />
              <div className="text-xl font-semibold text-brand-600 font-mono-tight">${result ? result.totalSpent.toFixed(2) : "0.00"}</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wide mt-1">Total Spent</div>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-neutral-200/80 p-4">
              <Gauge className="w-4 h-4 text-neutral-500 mb-3" />
              <div className="text-xl font-semibold text-neutral-900 font-mono-tight">{pct}%</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wide mt-1">Budget Used</div>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-neutral-200/80 p-4">
              <XCircle className="w-4 h-4 text-red-500 mb-3" />
              <div className="text-xl font-semibold text-red-600 font-mono-tight">{result ? result.securityIncidentsBlocked.length : 0}</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wide mt-1">Exploits Blocked</div>
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-neutral-200/80 p-4">
              <Users className="w-4 h-4 text-emerald-600 mb-3" />
              <div className="text-xl font-semibold text-emerald-600 font-mono-tight">0</div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wide mt-1">Human Approvals</div>
            </div>
          </div>

          {result && result.finalReport.findings.length > 0 && (
            <div className="col-span-12 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-6">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-4">Findings</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.finalReport.findings.map((f, i) => (
                  <div key={i} className="text-[13px] text-neutral-700 bg-neutral-50 px-4 py-3 rounded-xl leading-relaxed">
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          <ProviderLeaderboard logs={feedSteps} />
        </div>
      </main>
    </div>
  );
}
