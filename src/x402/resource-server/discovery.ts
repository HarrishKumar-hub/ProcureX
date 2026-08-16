export const discoveryMetadata = {
  name: "ProcureX Provider Services",
  description: "Cybersecurity services via x402 on Algorand",
  version: "1.0.0",
  services: [
    {
      id: "ip_reputation",
      name: "IP Reputation Service",
      description: "Get reputation score for an IP address",
      price: { amount: "0.01", currency: "USDC" },
      endpoint: "/services/ip-reputation"
    },
    {
      id: "threat_intelligence",
      name: "Threat Intelligence Service",
      description: "Advanced threat intel for an IP address",
      price: { amount: "0.02", currency: "USDC" },
      endpoint: "/services/threat-intelligence"
    },
    {
      id: "malware_analysis",
      name: "Malware Analysis Service",
      description: "Malware behavior and history analysis",
      price: { amount: "0.03", currency: "USDC" },
      endpoint: "/services/malware-analysis"
    }
  ]
};
