import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const SHA256_HASH = '4f82a93b5e7d1c8209bb7e12f90a541620c31be9450a8d71239c0fa1e6e9c31b';

export default function ChecksumCopyIsland() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHA256_HASH);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  };

  return (
    <div className="w-full max-w-[720px] p-4 rounded-xl bg-background border border-border-hairline flex flex-col items-center gap-2.5">
      <div className="flex items-center justify-between w-full text-[11px] font-mono text-foreground-muted">
        <span>OFFICIAL SHA-256 HASH VERIFICATION</span>
        <span className="text-accent-success font-medium">SIGNED BY L155A CORE RELEASE KEY</span>
      </div>

      <div className="flex items-center justify-between w-full gap-3 p-2.5 rounded-lg bg-surface border border-border-hairline">
        <code className="font-mono text-xs text-foreground-secondary break-all select-all">
          {SHA256_HASH}
        </code>
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 shrink-0 ${
            copied
              ? 'bg-accent-success/15 text-accent-success border border-accent-success/30'
              : 'bg-white/5 hover:bg-white/10 text-foreground border border-border-hairline'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Hash</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
