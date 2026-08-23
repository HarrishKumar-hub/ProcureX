export interface ThreatAnalystJudgment {
  agentId: string;
  assessment: string;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction: "MONITOR" | "ESCALATE" | "IGNORE";
}

export async function analyzeThreatData(rawVirusTotalData: any, ip: string): Promise<ThreatAnalystJudgment> {
  const stats = rawVirusTotalData?.lastAnalysisStats || {};
  const malicious = rawVirusTotalData?.maliciousCount ?? stats.malicious ?? 0;
  const suspicious = rawVirusTotalData?.suspiciousCount ?? stats.suspicious ?? 0;
  const total = rawVirusTotalData?.totalEngines ?? (
    (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0)
  ) ?? 0;

  const maliciousRatio = total > 0 ? malicious / total : 0;

  let confidenceLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let recommendedAction: "MONITOR" | "ESCALATE" | "IGNORE" = "IGNORE";
  let assessment = `Based on independent analysis of ${total} security engines, this IP shows minimal risk indicators.`;

  if (maliciousRatio > 0.15 || malicious > 5) {
    confidenceLevel = "HIGH";
    recommendedAction = "ESCALATE";
    assessment = `Independent analysis flags ${malicious} of ${total} engines reporting malicious activity for ${ip} — recommend escalation.`;
  } else if (maliciousRatio > 0.05 || suspicious > 0 || malicious > 0) {
    confidenceLevel = "MEDIUM";
    recommendedAction = "MONITOR";
    assessment = `Independent analysis finds moderate risk signals for ${ip} (${malicious} malicious, ${suspicious} suspicious of ${total} engines) — recommend continued monitoring.`;
  }

  return {
    agentId: "threat-intel-analyst-v1",
    assessment,
    confidenceLevel,
    recommendedAction
  };
}
