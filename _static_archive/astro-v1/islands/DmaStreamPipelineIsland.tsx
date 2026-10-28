import React, { useState, useEffect } from 'react';

export default function DmaStreamPipelineIsland() {
  const [throughput, setThroughput] = useState<number>(142.8);
  const [activeSlot, setActiveSlot] = useState<number>(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setThroughput(Number((138 + Math.random() * 8.4).toFixed(1)));
      setActiveSlot((prev) => (prev + 1) % 8);
    }, 240);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex flex-col gap-3.5 select-none text-left font-sans">
      {/* Top DMA Status Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-success" />
          <span className="text-foreground-secondary font-medium tracking-wide">DMA CONTROLLER</span>
        </div>
        <span className="text-[10px] text-accent font-mono font-medium">{throughput} MB/s CONSTANT</span>
      </div>

      {/* Dual Bus Flow Architecture (Borderless surface separation) */}
      <div className="p-3 rounded-lg bg-surface/80 flex flex-col gap-3">
        {/* Tier 1: Host OS Cache Bypass Rail */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-foreground-muted">
            <span className="tracking-wide">OS PAGE CACHE (VFS)</span>
            <span className="text-foreground-muted/60">0 CONTEXT SWITCHES</span>
          </div>
          <div className="h-5 rounded bg-white/[0.03] flex items-center justify-between px-2 text-[8px] font-mono text-foreground-muted/50">
            <span>BYPASSED</span>
            <span className="tracking-widest">ZERO FILE CACHE STALL</span>
            <span className="text-accent-success font-medium">0ms LOCKOUT</span>
          </div>
        </div>

        {/* Tier 2: Direct DMA Non-Buffered Ring Buffer (QD=32) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-foreground-muted">
            <span className="tracking-wide">ASYNC DMA RING BUFFER</span>
            <span className="text-accent-success font-medium">QUEUE DEPTH = 32</span>
          </div>

          {/* 8-Slot FIFO Register Array (Borderless chips) */}
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }).map((_, idx) => {
              const isActive = idx === activeSlot;
              const isFlushed = idx < activeSlot;

              return (
                <div
                  key={idx}
                  className={`h-7 rounded-[3px] transition-colors duration-150 flex flex-col items-center justify-center font-mono ${
                    isActive
                      ? 'bg-accent-success/20 text-accent-success shadow-sm'
                      : isFlushed
                      ? 'bg-white/[0.06] text-foreground-secondary'
                      : 'bg-white/[0.02] text-foreground-muted/40'
                  }`}
                >
                  <span className="text-[8px] font-semibold">Q{idx}</span>
                  <span className="text-[6px] tracking-tight text-accent-success">
                    {isActive ? 'WRITE' : 'SYNC'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low-Level Throughput Telemetry HUD (Borderless surface) */}
      <div className="p-3 rounded-lg bg-surface/70 flex flex-col gap-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">
            UNBUFFERED ASYNC I/O
          </span>
          <span className="text-[10px] font-medium text-accent-success px-1.5 py-0.5 rounded bg-accent-success/10">
            SATURATING BUS (USB 3.2)
          </span>
        </div>

        <div className="text-[10px] text-foreground-muted flex flex-col gap-1">
          <div className="flex justify-between">
            <span>BUFFER ARCHITECTURE:</span>
            <span className="text-foreground-secondary font-medium">64 MB NON-BUFFERED RING</span>
          </div>
          <div className="flex justify-between">
            <span>KERNEL OVERHEAD:</span>
            <span className="text-accent-success font-medium">0ms (DIRECT USER-TO-DEVICE)</span>
          </div>
          <div className="flex justify-between">
            <span>MICRO-STUTTER RATE:</span>
            <span className="text-foreground-secondary">0.00% (STABLE SUSTAINED)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
