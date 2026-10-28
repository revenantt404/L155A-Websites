import React, { useState, useEffect } from 'react';

export default function SectorVerifyMatrixIsland() {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [scanRow, setScanRow] = useState<number>(0);
  const [crcDigest, setCrcDigest] = useState<string>('0x9E4B12A8');

  // 48 cells (6 columns x 8 rows)
  const totalCells = 48;

  useEffect(() => {
    const timer = setInterval(() => {
      setScanRow((prev) => (prev + 1) % 8);
      setCrcDigest(`0x${Math.floor(0x10000000 + Math.random() * 0xEFFFFFFF).toString(16).toUpperCase()}`);
    }, 320);
    return () => clearInterval(timer);
  }, []);

  const activeIndex = hoveredCell !== null ? hoveredCell : scanRow * 6 + 2;
  const lbaAddress = `0x00${(0x100000 + activeIndex * 0x1000).toString(16).toUpperCase()}`;

  return (
    <div className="w-full flex flex-col gap-3.5 select-none text-left font-sans">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
          <span className="text-foreground-secondary font-medium tracking-wide">PARITY VERIFIER</span>
        </div>
        <span className="text-[10px] text-accent-success font-mono font-medium">CRC32 + SHA-256 PARALLEL</span>
      </div>

      {/* NAND Flash Silicon Cell Matrix (Borderless, seamless micro-cells) */}
      <div className="p-3 rounded-lg bg-surface/80 flex flex-col gap-2 relative overflow-hidden">
        {/* Silicon Matrix */}
        <div className="grid grid-cols-8 gap-1.5 relative">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const row = Math.floor(idx / 8);
            const isScanning = row === scanRow;
            const isHovered = hoveredCell === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCell(idx)}
                onMouseLeave={() => setHoveredCell(null)}
                className={`h-4 rounded-[2px] transition-colors duration-150 cursor-crosshair relative ${
                  isHovered
                    ? 'bg-accent'
                    : isScanning
                    ? 'bg-accent-success/50'
                    : 'bg-white/[0.04] hover:bg-white/[0.12]'
                }`}
              >
                {isHovered && (
                  <span className="absolute inset-0 bg-white/30 rounded-[2px] animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Scan Status Legend Bar */}
        <div className="flex items-center justify-between pt-1 font-mono text-[9px] text-foreground-muted">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-accent-success" />
              <span>VERIFIED (100%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-white/10" />
              <span>ECC ZERO-DEFECT</span>
            </span>
          </div>
          <span className="text-foreground-secondary">LBA {lbaAddress}</span>
        </div>
      </div>

      {/* Real-Time Hash Parity Inspector HUD (Borderless surface) */}
      <div className="p-3 rounded-lg bg-surface/70 flex flex-col gap-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground">
            SECTOR CRC32 POLYNOMIAL
          </span>
          <span className="text-[10px] font-medium text-accent-success px-1.5 py-0.5 rounded bg-accent-success/10">
            0 BAD BLOCKS (0.00%)
          </span>
        </div>

        <div className="text-[10px] text-foreground-muted flex flex-col gap-1">
          <div className="flex justify-between">
            <span>HARDWARE DIGEST:</span>
            <span className="text-foreground font-semibold tracking-wider">{crcDigest}</span>
          </div>
          <div className="flex justify-between">
            <span>BIT ERROR RATE:</span>
            <span className="text-foreground-secondary">&lt; 10&minus;15 (MATHEMATICAL INTEGRITY)</span>
          </div>
          <div className="flex justify-between">
            <span>PARITY LOCK:</span>
            <span className="text-accent-success">VERIFIED AT BUS SPEED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
