import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Layers, Cpu, Check } from 'lucide-react';

interface TabItem {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  heading: string;
  description: string;
  checklist: string[];
  filename: string;
  code: string;
}

const TABS: TabItem[] = [
  {
    id: 'tab1',
    number: '01',
    title: 'Dual-Tree Host Protection',
    icon: <ShieldCheck className="w-4 h-4 text-accent" />,
    heading: 'Host Drive Lock & Kernel Safety Filter',
    description:
      'L155A cross-verifies drive hardware bus topology (USBSTOR, NVMe-over-PCIe, SCSI). Internal system boot drives, recovery partitions, and active BitLocker volumes are cryptographically excluded from the destination roster before handles are requested.',
    checklist: [
      'Kernel-level host device exclusion roster',
      'Exclusive device locking via FSCTL_LOCK_VOLUME',
      'Zero unmount failure cascades during write phase',
    ],
    filename: 'daemon/guard.rs — Host Filter',
    code: `pub fn validate_target_bus(target: &Device) -> Result<DriveSafe> {
    if target.is_system_boot() || target.has_active_pagefile() {
        return Err(SecurityViolation::HostProtected);
    }
    target.acquire_exclusive_lock()?;
    Ok(DriveSafe::Isolated)
}`,
  },
  {
    id: 'tab2',
    number: '02',
    title: 'Deterministic ESP Creation',
    icon: <Layers className="w-4 h-4 text-accent" />,
    heading: 'Guaranteed UEFI ESP Boot Partition Stub',
    description:
      'Legacy or custom ISOs often lack compliant EFI System Partitions for modern Secure Boot hardware. L155A deterministically generates a clean 100MB FAT32 ESP stub containing signed EFI bootloaders (BOOTX64.EFI), ensuring universal boot compatibility.',
    checklist: [
      'Native UEFI Class 3 & CSM backward compliance',
      'Automatic 100MB FAT32 ESP boundary carving',
      'Validates Secure Boot signature certificate chains',
    ],
    filename: 'partition/esp_builder.rs',
    code: `// Carving 100MB FAT32 ESP at Sector 2048
let esp = gpt.create_partition(
    PartitionType::EfiSystemPartition,
    2048,
    206847
)?;
esp.format_fat32_volume("ESP_L155A")?;
esp.inject_efi_stub(&signed_bootloader)?;`,
  },
  {
    id: 'tab3',
    number: '03',
    title: 'Direct Sector I/O',
    icon: <Cpu className="w-4 h-4 text-accent" />,
    heading: 'Direct DMA Writes with Zero OS Buffering',
    description:
      'Windows OS writes files through shared file cache buffers that choke on gigabyte-sized disk image transfers. L155A initiates FILE_FLAG_NO_BUFFERING pipelines directly into the physical disk controller, sustaining maximum hardware write bandwidth.',
    checklist: [
      'Zero host memory allocation spikes or swap stalls',
      'Sustains 120+ MB/s on USB 3.2 Gen 2 flash controllers',
      'Concurrent CRC32 streaming bit-parity validation',
    ],
    filename: 'io/dma_writer.rs',
    code: `let flags = FILE_FLAG_NO_BUFFERING | FILE_FLAG_WRITE_THROUGH;
let handle = open_physical_drive(drive_id, flags)?;
while let Some(chunk) = stream.next_chunk() {
    handle.write_aligned_sector(chunk)?;
    telemetry.update_rate(chunk.len());
}`,
  },
];

export default function WorkflowsIsland() {
  const [activeTab, setActiveTab] = useState<string>('tab1');
  const current = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Tab Switcher Buttons */}
      <div className="flex gap-2 border-b border-border-hairline pb-3 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-card'
              }`}
            >
              <span className="font-mono text-xs opacity-60">{tab.number}</span>
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="rounded-xl bg-surface-card border border-border-hairline p-8 shadow-glass-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          >
            {/* Left Column: Description & Checklist */}
            <div className="flex flex-col gap-5 text-left">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                {current.heading}
              </h3>
              <p className="text-foreground-secondary leading-relaxed text-sm">
                {current.description}
              </p>

              <ul className="flex flex-col gap-2.5 font-mono text-xs text-foreground-secondary pt-2">
                {current.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent-success shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column: Code Terminal */}
            <div className="rounded-lg bg-background border border-border-hairline overflow-hidden text-left">
              <div className="px-4 py-2.5 bg-surface-elevated/40 border-b border-border-hairline flex items-center justify-between font-mono text-xs text-foreground-muted">
                <span>{current.filename}</span>
                <span className="text-accent-success font-semibold">PASS</span>
              </div>
              <pre className="p-4 font-mono text-xs text-foreground-secondary leading-relaxed overflow-x-auto">
                <code>{current.code}</code>
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
