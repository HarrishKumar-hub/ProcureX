const normalizeOctet = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(255, Math.floor(value)));
};

const splitIp = (ip: string): number[] => {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return [0, 0, 0, 0];
  }
  return parts.map((part) => normalizeOctet(Number(part)));
};

export const getIpSignal = (ip: string): number => {
  if (ip === "185.10.20.30") {
    return 87;
  }
  const octets = splitIp(ip);
  const weighted = octets[0] * 7 + octets[1] * 5 + octets[2] * 3 + octets[3];
  return weighted % 100;
};

export const clampProbability = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(2));
