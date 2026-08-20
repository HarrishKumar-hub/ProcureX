"use client";

import { useState } from "react";
import { ShieldCheck, Activity, Database, Banknote, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, Cpu } from "lucide-react";
import { runInvestigation, OrchestrationResult } from "@/lib/api";

export default function Dashboard() {
  const [targetIp, setTargetIp] = useState("185.10.20.30");
  const [simulateAttack, setSimulateAttack] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [feedSteps, setFeedSteps] = useState<Array<{type: string, message: string}>>([]);
  
  const handleRun = async () => {
    setIsInvestigating(true);
    setResult(null);
    setError(null);
    setFeedSteps([]);
    
    setFeedSteps(prev => [...prev, { type: 'PLANNING', message: `Analyzing intent: "Investigate suspicious IP ${targetIp}"...` }]);
    
    try {
      await new Promise(r => setTimeout(r, 600));
      
      const data = await runInvestigation(targetIp, 0.20, simulateAttack);
      
      for (const blocked of data.securityIncidentsBlocked) {
        setFeedSteps(prev => [...prev, { type: 'DISCOVERY', message: `Discovered candidate: ${blocked.providerId}` }]);
        await new Promise(r => setTimeout(r, 800));
        setFeedSteps(prev => [...prev, { type: 'BLOCKED', message: `🚨 Payment BLOCKED: ${blocked.providerId} ($${blocked.amount?.toFixed(2) ?? '?'})` }]);
        await new Promise(r => setTimeout(r, 600));
        setFeedSteps(prev => [...prev, { type: 'RECOVERY', message: `🔄 Autonomous Fallback: Retrying with next provider` }]);
        await new Promise(r => setTimeout(r, 600));
      }
      
      for (const step of data.stepsExecuted) {
        setFeedSteps(prev => [...prev, { type: 'DISCOVERY', message: `Discovered candidate for ${step.category}: ${step.providerId}` }]);
        await new Promise(r => setTimeout(r, 600));
        setFeedSteps(prev => [...prev, { type: 'APPROVED', message: `Payment APPROVED for ${step.providerId} ($${step.cost.toFixed(2)})` }]);
        await new Promise(r => setTimeout(r, 600));
        setFeedSteps(prev => [...prev, { type: 'EXECUTION', message: `Successfully executed ${step.category}.` }]);
        await new Promise(r => setTimeout(r, 600));
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-black/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gold-500/10 p-2 rounded-lg border border-gold-500/20">
            <Cpu className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">ProcureX</h1>
            <p className="text-xs text-slate-400">Economic Control Plane for Autonomous AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-slate-300">Algorand TestNet Connected</span>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="text-right">
            <div className="text-sm font-medium text-white">SecurityAgent-01</div>
            <div className="text-xs text-gold-400">Budget: $0.20 max/task</div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        
        <div className="col-span-1 space-y-6">
          <div className="bg-black/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Economic Guardrails
            </h2>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Max Single Tx</span>
                <span className="font-mono text-emerald-400">$0.05</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Min Trust Score</span>
                <span className="font-mono text-emerald-400">90 / 100</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Anomaly Multiplier</span>
                <span className="font-mono text-amber-400">5x Max</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Max Velocity</span>
                <span className="font-mono text-emerald-400">10 / min</span>
              </li>
            </ul>
          </div>

          <div className="bg-black/40 border border-amber-500/20 rounded-xl p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Attack Simulator
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enable this to artificially inject a malicious provider into the discovery layer with a 100x price markup ($2.00) to demonstrate the Economic Policy Engine blocking the AI's payment request.
            </p>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Simulate Price Gouging</span>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simulateAttack ? 'bg-amber-500' : 'bg-slate-700'}`}>
                <input type="checkbox" className="sr-only" checked={simulateAttack} onChange={e => setSimulateAttack(e.target.checked)} />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${simulateAttack ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-2 flex gap-2">
            <input 
              type="text" 
              value={targetIp} 
              onChange={e => setTargetIp(e.target.value)}
              className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:outline-none focus:ring-0 font-mono text-sm"
              placeholder="Target IP..."
            />
            <button 
              onClick={handleRun} 
              disabled={isInvestigating}
              className="bg-gold-500 hover:bg-gold-400 text-black px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInvestigating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isInvestigating ? "Executing..." : "Run Autonomous Investigation"}
            </button>
          </div>

          <div className="flex-1 bg-black/60 border border-white/5 rounded-xl p-6 font-mono text-sm overflow-y-auto min-h-[400px]">
            <div className="text-slate-500 mb-6"># Live Event Log</div>
            {error && (
              <div className="text-red-400 mb-4 bg-red-950/30 p-3 rounded border border-red-900/50">
                Error: {error}
              </div>
            )}
            <div className="space-y-4">
              {feedSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="mt-1">
                    {step.type === 'PLANNING' && <Activity className="w-4 h-4 text-blue-400" />}
                    {step.type === 'DISCOVERY' && <Database className="w-4 h-4 text-slate-400" />}
                    {step.type === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step.type === 'BLOCKED' && <XCircle className="w-4 h-4 text-red-400" />}
                    {step.type === 'EXECUTION' && <Banknote className="w-4 h-4 text-gold-400" />}
                  </div>
                  <div className="flex-1">
                    <span className={`
                      ${step.type === 'PLANNING' ? 'text-blue-400' : ''}
                      ${step.type === 'DISCOVERY' ? 'text-slate-300' : ''}
                      ${step.type === 'APPROVED' ? 'text-emerald-400 font-semibold' : ''}
                      ${step.type === 'BLOCKED' ? 'text-red-400 font-semibold' : ''}
                      ${step.type === 'EXECUTION' ? 'text-gold-400' : ''}
                    `}>
                      {step.message}
                    </span>
                  </div>
                </div>
              ))}
              {isInvestigating && (
                <div className="flex gap-4 items-center animate-pulse text-slate-500 mt-4">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent is thinking...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          {result ? (
            <>
              <div className="bg-black/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                  Final Incident Report
                </h2>
                
                <div className={`p-4 rounded-lg border flex items-center justify-center mb-6
                  ${result.finalReport.verdict === 'MALICIOUS' ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'}
                `}>
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-widest opacity-80 mb-1">Verdict</div>
                    <div className="text-2xl font-bold tracking-tight">{result.finalReport.verdict}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Findings</div>
                  {result.finalReport.findings.map((f, i) => (
                    <div key={i} className="text-sm text-slate-300 bg-white/5 p-2 rounded">
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Financial Summary
                </h2>
                <ul className="space-y-4 text-sm">
                  <li className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="font-mono text-gold-400">${result.totalSpent.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Budget Utilization</span>
                    <span className="font-mono text-white">{((result.totalSpent / result.budget) * 100).toFixed(0)}%</span>
                  </li>
                  <li className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Exploits Blocked</span>
                    <span className="font-mono text-red-400">{result.securityIncidentsBlocked.length}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Human Approvals</span>
                    <span className="font-mono text-emerald-400">0</span>
                  </li>
                </ul>
              </div>
            </>
          ) : (
             <div className="h-full border border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-sm p-6 text-center">
               Report will appear here once the investigation completes.
             </div>
          )}
        </div>

      </main>
    </div>
  );
}
