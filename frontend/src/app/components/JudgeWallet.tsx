"use client";

import React, { useState } from "react";

export default function JudgeWallet() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const handleConnect = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length > 10) {
      setConnectedAddress(trimmed);
      setIsOpen(false);
      setInputValue("");
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setInputValue("");
  };

  const handleDisconnect = () => {
    setConnectedAddress(null);
  };

  return (
    <>
      {connectedAddress === null ? (
        <button
          onClick={() => setIsOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-white hover:bg-neutral-50 rounded-full ring-1 ring-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 bg-white hover:bg-neutral-50 rounded-full ring-1 ring-neutral-200 px-3 py-1.5 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span className="text-xs font-mono font-medium text-neutral-900">
            {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
          </span>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase">
            JUDGE
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-80">
            <div className="font-semibold text-neutral-900 mb-1">Connect Judge Wallet</div>
            <div className="text-sm text-gray-500 mb-4">Paste your Algorand testnet address</div>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
              placeholder="ALGO testnet address..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
