"use client";

import React from "react";

export interface LogEntry {
  type: string;
  message: string;
  riskBreakdown?: {
    trustScore?: { value?: number; threshold?: number; passed?: boolean };
    priceAnomaly?: { currentPrice?: number; historicalAvg?: number; multiplier?: number; cap?: number; passed?: boolean };
    velocity?: { recentCount?: number; limit?: number; passed?: boolean };
  };
}

interface ProviderRecord {
  providerName: string;
  trustScore: number;
  priceCharged: number;
  verdict: "APPROVED" | "BLOCKED";
  savings: number;
}

export function ProviderLeaderboard({ logs }: { logs: LogEntry[] }) {
  try {
    const providerMap = new Map<string, ProviderRecord>();

    for (const log of logs || []) {
      if (log.type !== "APPROVED" && log.type !== "BLOCKED") continue;

      let name = "unknown";
      let price = 0;
      const verdict = log.type;

      if (log.riskBreakdown?.priceAnomaly?.currentPrice !== undefined) {
        price = log.riskBreakdown.priceAnomaly.currentPrice;
      }

      const matchName = log.message.match(/(?:for|BLOCKED:)\s+([^\s($]+)/);
      if (matchName && matchName[1]) {
        name = matchName[1];
      }

      if (price === 0) {
        const matchPrice = log.message.match(/\(\$([0-9.]+)\)/);
        if (matchPrice && matchPrice[1]) {
          price = parseFloat(matchPrice[1]);
        }
      }

      const trustScore = log.riskBreakdown?.trustScore?.value ?? 90;
      const savings = verdict === "BLOCKED" ? price : 0;

      providerMap.set(name, {
        providerName: name,
        trustScore,
        priceCharged: price,
        verdict,
        savings
      });
    }

    const records = Array.from(providerMap.values()).sort((a, b) => {
      if (a.verdict !== b.verdict) {
        return a.verdict === "BLOCKED" ? -1 : 1;
      }
      return b.priceCharged - a.priceCharged;
    });

    return (
      <div className="col-span-12 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-6">
        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-4">
          PROVIDER REGISTRY
        </div>

        {records.length === 0 ? (
          <div className="text-sm text-neutral-400 py-6 text-center">
            Run an investigation to populate provider data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                  <th className="py-2.5 px-3">Provider Name</th>
                  <th className="py-2.5 px-3">Trust Score</th>
                  <th className="py-2.5 px-3">Price Charged</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono text-[13px]">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-neutral-900">{r.providerName}</td>
                    <td className="py-3 px-3">
                      <span className={r.trustScore >= 90 ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>
                        {r.trustScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-700">${r.priceCharged.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.verdict === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-red-50 text-red-700 ring-1 ring-red-200"
                        }`}
                      >
                        {r.verdict}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {r.savings > 0 ? (
                        <span className="text-emerald-600 font-semibold">
                          ${r.savings.toFixed(2)} saved
                        </span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error("ProviderLeaderboard render error:", err);
    return (
      <div className="col-span-12 bg-white rounded-3xl ring-1 ring-neutral-200/80 p-6">
        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-4">
          PROVIDER REGISTRY
        </div>
        <div className="text-sm text-neutral-400 py-6 text-center">
          Run an investigation to populate provider data
        </div>
      </div>
    );
  }
}
