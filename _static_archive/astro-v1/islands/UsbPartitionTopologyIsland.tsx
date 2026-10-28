import React, { useState } from 'react';

interface PartitionData {
  id: string;
  label: string;
  role: string;
  guid: string;
  lbaStart: string;
  lbaEnd: string;
  size: string;
  fs: string;
  alignment: string;
  hex: string[];
}

const PARTITIONS: PartitionData[] = [
  {
    id: 'gpt',
    label: 'Primary GPT Header',
    role: 'Protective MBR + LBA 1 Partition Array',
    guid: '00000000-0000-0000-0000-000000000000',
    lbaStart: 'LBA 0',
    lbaEnd: 'LBA 33',
    size: '17 KB',
    fs: 'GPT Binary Header',
    alignment: '512B / 4096B Dual LBA',
    hex: [
      '45 46 49 20 50 41 52 54 00 00 01 00 5C 00 00 00',
      '9E 4B 12 A8 00 00 00 00 01 00 00 00 00 00 00 00',
    ],
  },
  {
    id: 'esp',
    label: 'EFI System Partition (ESP)',
    role: 'Hardware UEFI Boot Stub (BOOTX64.EFI)',
    guid: 'C12A7328-F81F-11D2-BA4B-00A0C93EC93B',
    lbaStart: 'LBA 2,048',
    lbaEnd: 'LBA 206,847',
    size: '100.0 MB',
    fs: 'FAT32 (Cluster 4K)',
    alignment: '4096-Byte Strict Boundary',
    hex: [
      'EB 58 90 4D 53 44 4F 53 35 2E 30 00 02 08 20 00',
      '02 00 00 00 00 F8 00 00 3F 00 FF 00 00 08 00 00',
    ],
  },
  {
    id: 'root',
    label: 'Main OS Root Image',
    role: 'Immutable Read-Only System Volume',
    guid: '0FC63DAF-8483-4772-8E79-3D69D8477DE4',
    lbaStart: 'LBA 206,848',
    lbaEnd: 'LBA 125,829,120',
    size: '61.3 GB',
    fs: 'Raw Disk Blocks (Direct DMA)',
    alignment: '4096-Byte Native DMA',
    hex: [
      '7F 45 4C 46 02 01 01 00 00 00 00 00 00 00 00 00',
      '03 00 3E 00 01 00 00 00 80 A2 04 00 00 00 00 00',
    ],
  },
];

export default function UsbPartitionTopologyIsland() {
  const [selectedId, setSelectedId] = useState<string>('esp');
  const active = PARTITIONS.find((p) => p.id === selectedId) || PARTITIONS[1];

  return (
    <div className="w-full flex flex-col gap-3.5 select-none text-left font-sans">
      {/* Top Topology Status Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-success" />
          <span className="text-foreground-secondary font-medium tracking-wide">DISK TOPOLOGY</span>
        </div>
        <span className="text-[10px] text-foreground-muted font-mono">GUID TABLE &bull; REV 1.0</span>
      </div>

      {/* Seamless Partition Slicer (Zero noisy borders) */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-11 rounded-lg bg-surface/80 p-1 flex gap-1 items-center relative overflow-hidden">
          {/* GPT Block */}
          <button
            type="button"
            onClick={() => setSelectedId('gpt')}
            onMouseEnter={() => setSelectedId('gpt')}
            className={`h-full rounded-md transition-colors flex flex-col justify-center px-2 text-left relative overflow-hidden ${
              selectedId === 'gpt'
                ? 'w-[20%] bg-white/10 text-foreground'
                : 'w-[18%] bg-white/[0.03] hover:bg-white/[0.06] text-foreground-muted'
            }`}
          >
            <span className="font-mono text-[9px] font-semibold tracking-tight truncate">
              LBA 0
            </span>
            <span className="font-mono text-[8px] text-foreground-muted truncate">
              GPT
            </span>
          </button>

          {/* ESP Boot Block (Featured) */}
          <button
            type="button"
            onClick={() => setSelectedId('esp')}
            onMouseEnter={() => setSelectedId('esp')}
            className={`h-full rounded-md transition-colors flex flex-col justify-center px-2.5 text-left relative overflow-hidden ${
              selectedId === 'esp'
                ? 'w-[36%] bg-accent-success/15 text-accent-success'
                : 'w-[34%] bg-white/[0.03] hover:bg-white/[0.06] text-foreground-muted'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`font-mono text-[10px] font-semibold tracking-tight truncate ${selectedId === 'esp' ? 'text-accent-success' : 'text-foreground'}`}>
                ESP FAT32
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
            </div>
            <span className="font-mono text-[8px] text-foreground-muted truncate">
              100 MB &bull; UEFI BOOT
            </span>
          </button>

          {/* OS Data Block */}
          <button
            type="button"
            onClick={() => setSelectedId('root')}
            onMouseEnter={() => setSelectedId('root')}
            className={`h-full rounded-md transition-colors flex flex-col justify-center px-2.5 text-left relative overflow-hidden flex-1 ${
              selectedId === 'root'
                ? 'bg-white/10 text-foreground'
                : 'bg-white/[0.03] hover:bg-white/[0.06] text-foreground-muted'
            }`}
          >
            <span className="font-mono text-[10px] font-semibold tracking-tight truncate">
              DATA VOLUME
            </span>
            <span className="font-mono text-[8px] text-foreground-muted truncate">
              61.3 GB &bull; ALIGNED
            </span>
          </button>
        </div>

        {/* LBA Micro Ruler */}
        <div className="flex justify-between items-center px-1 font-mono text-[8px] text-foreground-muted/50">
          <span>0x0000</span>
          <span>LBA 2,048</span>
          <span>LBA 206,848</span>
          <span>0x077F...</span>
        </div>
      </div>

      {/* Terminal Hex & Sector Inspector HUD (Clean surface tint, no border) */}
      <div className="p-3 rounded-lg bg-surface/70 flex flex-col gap-2 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground">
              {active.label}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-accent-success font-medium">
            {active.alignment}
          </span>
        </div>

        {/* GUID & Range Subtext */}
        <div className="text-[10px] text-foreground-muted flex flex-col gap-0.5">
          <div className="flex justify-between">
            <span>SECTOR RANGE:</span>
            <span className="text-foreground-secondary">{active.lbaStart} &rarr; {active.lbaEnd}</span>
          </div>
          <div className="flex justify-between">
            <span>TYPE GUID:</span>
            <span className="text-foreground-secondary tracking-tighter truncate max-w-[170px]">{active.guid}</span>
          </div>
        </div>

        {/* Raw Micro Hex Stream */}
        <div className="pt-2 flex flex-col gap-0.5 text-[9px] text-foreground-muted leading-relaxed">
          {active.hex.map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-foreground-muted/40 select-none">00{idx * 16}:</span>
              <span className="text-foreground-secondary tracking-wider font-mono">{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
