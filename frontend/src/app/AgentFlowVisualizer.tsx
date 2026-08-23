"use client";

import React from "react";
import { ShieldCheck, Lock, Radio, Server, ArrowDown, ExternalLink } from "lucide-react";

interface FlowVisualizerProps {
  isInvestigating: boolean;
  feedSteps: Array<{ type: string; message: string; riskBreakdown?: any; transactionId?: string }>;
  simulateAttack: boolean;
}

const BUYER_ADDR = "4U63RU6G52MUBG4QTYAJKG4ZBZ55Z4BXQUA3RTDNLVTOV7KLTWZNKKRM7I";
const FACILITATOR_ADDR = "ZMFK4MQIFV2JICX372U5VAY35R626W32G2W5H4J335552AA";
const PROVIDER_ADDR = "Q7WBPIACMGRP22LTEK5DBYUJOQTPB2BEYMRNNXKZOFYV5PFXJRDT35DXUY";

export function AgentFlowVisualizer({ isInvestigating, feedSteps, simulateAttack }: FlowVisualizerProps) {
  const hasPlanning = feedSteps.some((s) => s.type === "PLANNING");
  const hasBlocked = feedSteps.some((s) => s.type === "BLOCKED");
  const approvedSteps = feedSteps.filter((s) => s.type === "APPROVED");
  const latestApproved = approvedSteps[approvedSteps.length - 1];
  const isFinished = !isInvestigating && feedSteps.length > 0;

  let policyStatus = "IDLE";
  let policyBadgeClass = "bg-neutral-100 text-neutral-600 border-neutral-200";
  
  if (hasBlocked) {
    policyStatus = "BLOCKED";
    policyBadgeClass = "bg-red-50 text-red-700 border-red-200 font-semibold animate-pulse";
  } else if (latestApproved) {
    policyStatus = "APPROVED";
    policyBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
  } else if (hasPlanning || isInvestigating) {
    policyStatus = "EVALUATING...";
    policyBadgeClass = "bg-amber-50 text-amber-700 border-amber-200 font-semibold animate-pulse";
  }

  let flowState: "idle" | "evaluating" | "approved" | "blocked" | "settled" = "idle";
  if (isInvestigating) {
    flowState = hasBlocked ? "blocked" : latestApproved ? "approved" : "evaluating";
  } else if (isFinished) {
    flowState = hasBlocked ? "blocked" : "settled";
  }

  return (
    <div className="col-span-12 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
          Live Agent Payment Flow
        </div>
        <div className="text-xs font-mono text-neutral-500">
          State: <span className="font-semibold text-neutral-900 uppercase">{flowState}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center relative">
        {/* Node 1: SecurityAgent-01 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          flowState !== "idle" ? "bg-slate-900 text-white border-slate-700 shadow-md" : "bg-neutral-50 border-neutral-200 text-neutral-900"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold font-mono">SecurityAgent-01</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 truncate" title={BUYER_ADDR}>
            {BUYER_ADDR.slice(0, 6)}...{BUYER_ADDR.slice(-4)}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Treasury</span>
            <span className="font-mono font-semibold text-emerald-400">$0.20 USDC</span>
          </div>
        </div>

        {/* Node 2: ProcureX Policy Engine */}
        <div className={`p-4 rounded-2xl border transition-all ${
          policyStatus === "BLOCKED"
            ? "bg-red-950 text-red-100 border-red-800 shadow-red-900/20 shadow-lg"
            : policyStatus === "APPROVED"
            ? "bg-slate-900 text-white border-emerald-600/50"
            : "bg-neutral-50 border-neutral-200 text-neutral-900"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold font-mono">Policy Engine</span>
          </div>
          <div className="text-[10px] text-neutral-400 mb-2">Enforcing Risk Controls</div>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${policyBadgeClass}`}>
            {policyStatus}
          </span>
        </div>

        {/* Node 3: GoPlausible Facilitator */}
        <div className={`p-4 rounded-2xl border transition-all ${
          flowState === "approved" || flowState === "settled"
            ? "bg-slate-900 text-white border-emerald-500/50 shadow-md"
            : "bg-neutral-50 border-neutral-200 text-neutral-900"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold font-mono">GoPlausible</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 truncate" title={FACILITATOR_ADDR}>
            {FACILITATOR_ADDR.slice(0, 6)}...{FACILITATOR_ADDR.slice(-4)}
          </div>
          <div className="mt-3 text-[10px] font-mono text-emerald-400">
            {flowState === "settled" || flowState === "approved" ? "Broadcasted ✅" : "Waiting for Policy..."}
          </div>
        </div>

        {/* Node 4: Provider Agent */}
        <div className={`p-4 rounded-2xl border transition-all ${
          latestApproved
            ? "bg-slate-900 text-white border-emerald-500 shadow-emerald-950/40 shadow-lg"
            : "bg-neutral-50 border-neutral-200 text-neutral-900"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold font-mono truncate">
              {latestApproved ? latestApproved.message.split(" ")[3] || "Provider Agent" : "Provider Agent"}
            </span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 truncate" title={PROVIDER_ADDR}>
            {PROVIDER_ADDR.slice(0, 6)}...{PROVIDER_ADDR.slice(-4)}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Settled</span>
            <span className="font-mono font-semibold text-emerald-400">
              {latestApproved ? "Received ✅" : "$0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Real TxID Display at bottom */}
      {latestApproved?.transactionId && (
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">On-Chain Settlement Proof:</span>
          <a
            href={`https://lora.algokit.io/testnet/transaction/${latestApproved.transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold"
          >
            View on Lora: {latestApproved.transactionId.slice(0, 10)}...{latestApproved.transactionId.slice(-6)}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
